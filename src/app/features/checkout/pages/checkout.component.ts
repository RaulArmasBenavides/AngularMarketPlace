import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { PaymentFactoryService } from 'src/app/core/services/payment-factory.service';
import { PaymentDetails } from 'src/app/core/services/payment-provider.interface';
import { LoadingService } from 'src/app/core/services/loading.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { OrdersService } from 'src/app/core/services/orders.service';
import { IStripePaymentProvider } from 'src/app/core/services/stripe-payment.interface';
import { IPaypalPaymentProvider } from 'src/app/core/services/paypal-payment.interface';
import { CartService } from 'src/app/services/cart.service';
import { environment } from 'src/environments/environment';
import { ShippingAddress } from 'src/app/models/payment.model';

// Estimado para mostrar en pantalla. El servidor calcula el total real al crear el pedido.
const ESTIMATED_SHIPPING = 10;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit, AfterViewInit {
  @ViewChild('cardElement') cardElementContainer?: ElementRef<HTMLElement>;
  @ViewChild('paypalButtonContainer') paypalButtonContainer?: ElementRef<HTMLElement>;

  checkoutForm!: FormGroup;
  isProcessingPayment = false;
  currentStep = 1;
  paymentProvider = environment.paymentProvider;

  cartItems: { id: string; name: string; price: number; quantity: number }[] = [];
  subtotal = 0;
  shipping = 0;
  tax = 0;
  total = 0;

  constructor(
    private fb: FormBuilder,
    private paymentFactory: PaymentFactoryService,
    private ordersService: OrdersService,
    private cartService: CartService,
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCart();
    this.initializePaymentProvider();
  }

  ngAfterViewInit(): void {
    // El paso 2 aún no está en el DOM aquí; el UI de pago se monta en nextStep().
  }

  private initializeForm(): void {
    this.checkoutForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      saveCard: [false],
    });
  }

  private loadCart(): void {
    this.cartItems = this.cartService.getCartItems().map((item) => ({
      id: item.productId,
      name: item.productName,
      price: item.price,
      quantity: item.quantity,
    }));
    this.subtotal = this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.shipping = this.cartItems.length > 0 ? ESTIMATED_SHIPPING : 0;
    this.total = this.subtotal + this.shipping + this.tax;
  }

  private async initializePaymentProvider(): Promise<void> {
    try {
      await this.paymentFactory.getPaymentProvider().initialize();
    } catch (error) {
      this.notificationService.showError('No se pudo inicializar el proveedor de pago');
      console.error('Payment provider initialization error:', error);
    }
  }

  private setupPaymentUI(): void {
    const provider = this.paymentFactory.getPaymentProvider();

    if (this.isStripeProvider(provider) && this.cardElementContainer) {
      provider.createCardElement(this.cardElementContainer.nativeElement)
        .catch((err) => console.error('Failed to create card element:', err));
    } else if (this.isPayPalProvider(provider) && this.paypalButtonContainer) {
      provider.initializePayPalButtons(
        this.paypalButtonContainer.nativeElement.id,
        (details: PaymentDetails) => this.onPayPalApprove(details)
      );
    }
  }

  private isStripeProvider(provider: unknown): provider is IStripePaymentProvider {
    return provider !== null && typeof provider === 'object' && 'getStripe' in provider;
  }

  private isPayPalProvider(provider: unknown): provider is IPaypalPaymentProvider {
    return provider !== null && typeof provider === 'object' && 'initializePayPalButtons' in provider;
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.checkoutForm.valid && this.cartItems.length > 0) {
      this.currentStep = 2;
      this.cdr.detectChanges(); // renderizar el contenedor del paso 2 antes de montar el pago
      this.setupPaymentUI();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /**
   * Flujo con Stripe: crear pedido → crear PaymentIntent → cobrar con la tarjeta
   * → confirmar en el backend, que verifica el pago contra el total del pedido.
   */
  async onSubmit(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.notificationService.showError('Completa todos los campos obligatorios');
      return;
    }
    if (this.cartItems.length === 0) {
      this.notificationService.showError('Tu carrito está vacío');
      return;
    }

    const provider = this.paymentFactory.getPaymentProvider();
    if (!this.isStripeProvider(provider)) {
      this.notificationService.showError('Por ahora el checkout solo acepta Stripe');
      return;
    }

    this.isProcessingPayment = true;
    this.loadingService.show();

    try {
      const order = await firstValueFrom(
        this.ordersService.create(
          this.cartItems.map((item) => ({ productId: Number(item.id), quantity: item.quantity })),
          this.getShippingAddress()
        )
      );

      const intent = await firstValueFrom(provider.createPaymentIntent(order.totalAmount, order._id));

      const result = await provider.confirmCardPayment(intent.clientSecret);
      if (result.error) {
        throw new Error(result.error.message ?? 'El pago fue rechazado');
      }

      await firstValueFrom(provider.processPayment(intent.id, { orderId: order._id }));

      this.cartService.clearCart();
      this.notificationService.showSuccess('¡Pago realizado con éxito!');
      await this.router.navigate(['/checkout/order-confirmation', order._id]);
    } catch (error) {
      console.error('Checkout error:', error);
      this.notificationService.showError(this.errorMessage(error));
    } finally {
      this.isProcessingPayment = false;
      this.loadingService.hide();
    }
  }

  private onPayPalApprove(details: PaymentDetails): void {
    // PayPal aún no está completo: el pedido debe crearse antes de mostrar los botones.
    console.warn('PayPal approval recibido, flujo pendiente de implementar', details);
    this.notificationService.showError('El pago con PayPal aún no está disponible');
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.error === 'string') {
      return error.error.error;
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'No se pudo completar el pago';
  }

  getShippingAddress(): ShippingAddress {
    const formValue = this.checkoutForm.value;
    return {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      street: formValue.street,
      city: formValue.city,
      state: formValue.state,
      postalCode: formValue.postalCode,
      country: formValue.country,
      phone: formValue.phone,
    };
  }
}
