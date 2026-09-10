import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaymentFactoryService } from 'src/app/core/services/payment-factory.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { environment } from 'src/environments/environment';
import { ShippingAddress } from 'src/app/models/payment.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  @ViewChild('cardElement') cardElementContainer!: ElementRef;
  @ViewChild('paypalButtonContainer') paypalButtonContainer!: ElementRef;

  checkoutForm!: FormGroup;
  isLoading = false;
  isProcessingPayment = false;
  currentStep = 1;
  paymentProvider = environment.paymentProvider;

  // Mock cart data (in real app, would come from CartService)
  cartItems = [
    { id: 1, name: 'Laptop', price: 1299, quantity: 1 },
    { id: 2, name: 'Mouse', price: 99, quantity: 1 },
  ];

  subtotal = 1398;
  shipping = 10;
  tax = 112;
  total = 1520;

  constructor(
    private fb: FormBuilder,
    private paymentFactory: PaymentFactoryService,
    private authService: AuthService,
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initializePaymentProvider();
  }

  private initializeForm(): void {
    this.checkoutForm = this.fb.group({
      // Shipping Address
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['', [Validators.required]],
      phone: ['', [Validators.required]],

      // Payment Info
      saveCard: [false],
      billingAddressSame: [true],
    });
  }

  private async initializePaymentProvider(): Promise<void> {
    try {
      this.isLoading = true;
      const provider = this.paymentFactory.getPaymentProvider();
      await provider.initialize();

      if (this.paymentProvider === 'stripe') {
        setTimeout(() => {
          if (this.cardElementContainer) {
            // Create Stripe card element
            const stripeService = this.paymentFactory.getPaymentProvider() as any;
            stripeService.createCardElement(this.cardElementContainer.nativeElement);
          }
        }, 100);
      } else if (this.paymentProvider === 'paypal') {
        setTimeout(() => {
          if (this.paypalButtonContainer) {
            // Initialize PayPal buttons
            const paypalService = this.paymentFactory.getPaymentProvider() as any;
            paypalService.initializePayPalButtons(
              this.paypalButtonContainer.nativeElement,
              (details: any) => this.onPayPalApprove(details)
            );
          }
        }, 100);
      }
    } catch (error) {
      this.notificationService.showError('Failed to initialize payment provider');
      console.error('Payment provider initialization error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.checkoutForm.valid) {
      this.currentStep = 2;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.notificationService.showError('Please fill all required fields');
      return;
    }

    this.isProcessingPayment = true;
    this.loadingService.show();

    const provider = this.paymentFactory.getPaymentProvider();
    const orderId = `ORDER-${Date.now()}`;

    // Step 1: Create payment intent
    provider.createPaymentIntent(this.total, orderId).pipe(
      catchError((error) => {
        this.notificationService.showError('Failed to create payment intent');
        return of(null);
      }),
      finalize(() => {
        if (this.paymentProvider === 'stripe') {
          // For Stripe, card element submission is handled by PayPal buttons or manual submit
          this.handleStripePayment();
        }
        // For PayPal, payment is handled by PayPal button callbacks
      })
    ).subscribe();
  }

  private handleStripePayment(): void {
    const provider = this.paymentFactory.getPaymentProvider() as any;
    const stripe = provider.getStripe();

    if (!stripe) {
      this.notificationService.showError('Stripe not available');
      return;
    }

    // In a real implementation, you would call confirmCardPayment here
    this.notificationService.showSuccess('Payment processed successfully!');
    this.router.navigate(['/order-confirmation']);
  }

  private onPayPalApprove(details: any): void {
    this.isProcessingPayment = true;
    this.loadingService.show();

    const provider = this.paymentFactory.getPaymentProvider();

    provider.processPayment(details.id, {
      paypalDetails: details,
    })
      .pipe(finalize(() => {
        this.isProcessingPayment = false;
        this.loadingService.hide();
      }))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.showSuccess('Order placed successfully!');
            this.router.navigate(['/order-confirmation']);
          }
        },
        error: () => {
          this.notificationService.showError('Payment processing failed');
        },
      });
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
