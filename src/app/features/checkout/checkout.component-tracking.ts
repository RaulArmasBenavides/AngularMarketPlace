/**
 * TRACKING INTEGRATION FOR CHECKOUT COMPONENT
 *
 * Add this to your checkout.component.ts file
 * This shows how to integrate analytics tracking
 */

// In checkout.component.ts constructor:
constructor(
  private fb: FormBuilder,
  private paymentFactory: PaymentFactoryService,
  private authService: AuthService,
  private loadingService: LoadingService,
  private notificationService: NotificationService,
  private analyticsService: AnalyticsService,  // ADD THIS
  private router: Router
) {}

// In ngOnInit():
ngOnInit(): void {
  this.initializeForm();
  this.initializePaymentProvider();

  // Track checkout initiation
  const totals = this.getCartTotals();
  this.analyticsService.trackInitiateCheckout(this.cartItems, totals.total);
}

// In onSubmit() after successful payment:
onSubmit(): void {
  if (this.checkoutForm.invalid) {
    this.notificationService.showError('Please fill all required fields');
    return;
  }

  this.isProcessingPayment = true;
  this.loadingService.show();

  const provider = this.paymentFactory.getPaymentProvider();
  const orderId = `ORDER-${Date.now()}`;

  provider.createPaymentIntent(this.total, orderId).pipe(
    catchError((error) => {
      this.notificationService.showError('Failed to create payment intent');
      return of(null);
    }),
    finalize(() => {
      if (this.paymentProvider === 'stripe') {
        this.handleStripePayment();
      }
    })
  ).subscribe(
    (response) => {
      // SUCCESS - Track purchase
      const orderData = {
        orderNumber: orderId,
        totalAmount: this.total,
        items: this.cartItems,
        tax: this.tax,
        shipping: this.shipping,
      };

      // TRACK PURCHASE (Google Analytics + Meta Pixel + Google Ads)
      this.analyticsService.trackPurchase(orderData);

      this.notificationService.showSuccess('Payment processed successfully!');
      this.router.navigate(['/order-confirmation']);
    }
  );
}
