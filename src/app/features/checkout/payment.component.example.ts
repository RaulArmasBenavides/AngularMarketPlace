import { Component, OnInit, OnDestroy } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { CartService, CartItem } from '../../services/cart.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface PaymentPayload {
  paymentIntentId: string;
  provider: 'stripe' | 'paypal';
  shippingAddress: ShippingAddress;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  payerId?: string;
}

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
})
export class PaymentComponent implements OnInit, OnDestroy {
  paymentMethod: 'stripe' | 'paypal' = 'paypal';
  isProcessing = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  shippingAddress: ShippingAddress = {
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
  };

  cartItems: CartItem[] = [];
  subtotal = 0;
  shipping = 10;
  tax = 0;
  total = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private paymentService: PaymentService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadCartItems();
    this.calculateTotals();
    this.initializePayPal();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Cargar items del carrito
  private loadCartItems(): void {
    this.cartService.getItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.cartItems = items;
        this.calculateTotals();
      });
  }

  // Calcular totales
  private calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.tax = this.subtotal * 0.08; // 8% tax
    this.total = this.subtotal + this.shipping + this.tax;
  }

  // Procesar pago
  async processPayment(): Promise<void> {
    this.isProcessing = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      // Validar dirección
      if (!this.isAddressValid()) {
        throw new Error('Por favor completa toda la dirección de envío');
      }

      const orderId = this.generateOrderId();

      if (this.paymentMethod === 'stripe') {
        await this.processStripePayment(orderId);
      } else if (this.paymentMethod === 'paypal') {
        await this.processPayPalPayment(orderId);
      }
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Error al procesar pago';
      console.error('Payment error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Procesar con Stripe
  private async processStripePayment(orderId: string): Promise<void> {
    // Crear payment intent
    const intentResponse = await this.paymentService
      .createPaymentIntent(this.total, orderId, 'stripe')
      .toPromise();

    if (!intentResponse || !intentResponse.clientSecret) {
      throw new Error('No se pudo crear payment intent');
    }

    // Aquí integraría Stripe.js para procesar el pago
    // const stripe = Stripe(PUBLIC_KEY);
    // const result = await stripe.confirmCardPayment(intentResponse.clientSecret, {...});

    // Por ahora, simular confirmación
    this.completePayment(orderId, intentResponse.id, 'stripe');
  }

  // Procesar con PayPal
  private async processPayPalPayment(orderId: string): Promise<void> {
    // Crear payment intent en PayPal
    const intentResponse = await this.paymentService
      .createPaymentIntent(this.total, orderId, 'paypal')
      .toPromise();

    if (!intentResponse || !intentResponse.approvalUrl) {
      throw new Error('No se pudo crear pago en PayPal');
    }

    // Guardar datos en sessionStorage para recuperar después
    sessionStorage.setItem(
      'paypalTransaction',
      JSON.stringify({
        paymentId: intentResponse.id,
        orderId,
      })
    );

    // Redirigir a PayPal
    window.location.href = intentResponse.approvalUrl;
  }

  async completePayment(
    orderId: string,
    paymentIntentId: string,
    provider: 'stripe' | 'paypal'
  ): Promise<void> {
    try {
      const payload: PaymentPayload = {
        paymentIntentId,
        provider,
        shippingAddress: this.shippingAddress,
        items: this.cartItems,
        subtotal: this.subtotal,
        shipping: this.shipping,
        tax: this.tax,
      };

      if (provider === 'paypal') {
        const payerId = this.paymentService.getPayerIdFromUrl();
        if (payerId) {
          payload.payerId = payerId;
        }
      }

      const response = await this.paymentService.processPayment(payload).toPromise();

      if (response && response.success) {
        this.successMessage = `¡Pago completado! Número de orden: ${response.order.orderNumber}`;
        // Limpiar carrito
        this.cartService.clear();
        // Redirigir a página de confirmación
        setTimeout(() => {
          window.location.href = `/order-confirmation/${response.order.id}`;
        }, 2000);
      } else {
        throw new Error(response?.message || 'Pago no completado');
      }
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Error al completar pago';
      throw error;
    }
  }

  // Validar dirección
  private isAddressValid(): boolean {
    return (
      this.shippingAddress.firstName &&
      this.shippingAddress.lastName &&
      this.shippingAddress.street &&
      this.shippingAddress.city &&
      this.shippingAddress.state &&
      this.shippingAddress.postalCode &&
      this.shippingAddress.country &&
      this.shippingAddress.phone
    );
  }

  // Generar ID de orden única
  private generateOrderId(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Inicializar PayPal
  private initializePayPal(): void {
    // Si necesitas usar PayPal Client SDK
    if (this.paymentMethod === 'paypal') {
      this.paymentService.initializePayPal();
    }
  }
}

/**
 * EJEMPLO DE PLANTILLA HTML (payment.component.html):
 *
 * <div class="payment-container">
 *   <h2>Resumen de Pago</h2>
 *
 *   <!-- Mostrar error -->
 *   <div *ngIf="errorMessage" class="alert alert-danger">
 *     {{ errorMessage }}
 *   </div>
 *
 *   <!-- Mostrar éxito -->
 *   <div *ngIf="successMessage" class="alert alert-success">
 *     {{ successMessage }}
 *   </div>
 *
 *   <!-- Carrito -->
 *   <div class="cart-summary">
 *     <h3>Artículos</h3>
 *     <div *ngFor="let item of cartItems" class="cart-item">
 *       <span>{{ item.name }}</span>
 *       <span>{{ item.quantity }} x ${{ item.price }}</span>
 *       <span class="total">${{ item.price * item.quantity }}</span>
 *     </div>
 *   </div>
 *
 *   <!-- Totales -->
 *   <div class="totals">
 *     <div class="total-row">
 *       <span>Subtotal:</span>
 *       <span>${{ subtotal | number:'1.2-2' }}</span>
 *     </div>
 *     <div class="total-row">
 *       <span>Envío:</span>
 *       <span>${{ shipping | number:'1.2-2' }}</span>
 *     </div>
 *     <div class="total-row">
 *       <span>Impuestos:</span>
 *       <span>${{ tax | number:'1.2-2' }}</span>
 *     </div>
 *     <div class="total-row grand-total">
 *       <span><strong>Total:</strong></span>
 *       <span><strong>${{ total | number:'1.2-2' }}</strong></span>
 *     </div>
 *   </div>
 *
 *   <!-- Dirección de Envío -->
 *   <div class="shipping-address">
 *     <h3>Dirección de Envío</h3>
 *     <div class="form-group">
 *       <input
 *         type="text"
 *         placeholder="Nombre"
 *         [(ngModel)]="shippingAddress.firstName"
 *         class="form-control"
 *       />
 *     </div>
 *     <div class="form-group">
 *       <input
 *         type="text"
 *         placeholder="Apellido"
 *         [(ngModel)]="shippingAddress.lastName"
 *         class="form-control"
 *       />
 *     </div>
 *     <div class="form-group">
 *       <input
 *         type="text"
 *         placeholder="Calle"
 *         [(ngModel)]="shippingAddress.street"
 *         class="form-control"
 *       />
 *     </div>
 *     <div class="form-row">
 *       <div class="form-group col">
 *         <input
 *           type="text"
 *           placeholder="Ciudad"
 *           [(ngModel)]="shippingAddress.city"
 *           class="form-control"
 *         />
 *       </div>
 *       <div class="form-group col">
 *         <input
 *           type="text"
 *           placeholder="Estado"
 *           [(ngModel)]="shippingAddress.state"
 *           class="form-control"
 *         />
 *       </div>
 *       <div class="form-group col">
 *         <input
 *           type="text"
 *           placeholder="Código Postal"
 *           [(ngModel)]="shippingAddress.postalCode"
 *           class="form-control"
 *         />
 *       </div>
 *     </div>
 *     <div class="form-group">
 *       <input
 *         type="text"
 *         placeholder="País"
 *         [(ngModel)]="shippingAddress.country"
 *         class="form-control"
 *       />
 *     </div>
 *     <div class="form-group">
 *       <input
 *         type="tel"
 *         placeholder="Teléfono"
 *         [(ngModel)]="shippingAddress.phone"
 *         class="form-control"
 *       />
 *     </div>
 *   </div>
 *
 *   <!-- Método de Pago -->
 *   <div class="payment-method">
 *     <h3>Método de Pago</h3>
 *     <div class="form-group">
 *       <label>
 *         <input type="radio" value="paypal" [(ngModel)]="paymentMethod" />
 *         PayPal
 *       </label>
 *     </div>
 *     <div class="form-group">
 *       <label>
 *         <input type="radio" value="stripe" [(ngModel)]="paymentMethod" />
 *         Tarjeta Crédito (Stripe)
 *       </label>
 *     </div>
 *   </div>
 *
 *   <!-- Botón Pagar -->
 *   <button
 *     (click)="processPayment()"
 *     [disabled]="isProcessing"
 *     class="btn btn-primary btn-lg btn-block"
 *   >
 *     <span *ngIf="!isProcessing">Procesar Pago - ${{ total | number:'1.2-2' }}</span>
 *     <span *ngIf="isProcessing">Procesando...</span>
 *   </button>
 * </div>
 */
