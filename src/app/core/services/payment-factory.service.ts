import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IPaymentProvider } from './payment-provider.interface';
import { StripePaymentService } from './stripe-payment.service';
import { PaypalPaymentService } from './paypal-payment.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentFactoryService {
  private paymentProvider: IPaymentProvider | null = null;

  constructor(
    private stripeService: StripePaymentService,
    private paypalService: PaypalPaymentService
  ) {}

  /**
   * Get the appropriate payment provider based on configuration
   */
  getPaymentProvider(): IPaymentProvider {
    if (!this.paymentProvider) {
      this.paymentProvider = this.createPaymentProvider();
    }
    return this.paymentProvider;
  }

  /**
   * Create the payment provider based on environment configuration
   */
  private createPaymentProvider(): IPaymentProvider {
    const provider = environment.paymentProvider.toLowerCase();

    switch (provider) {
      case 'stripe':
        return this.stripeService;
      case 'paypal':
        return this.paypalService;
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  /**
   * Get the provider name (useful for UI)
   */
  getProviderName(): string {
    return this.getPaymentProvider().getProviderName();
  }

  /**
   * Initialize the current payment provider
   */
  async initialize(): Promise<void> {
    const provider = this.getPaymentProvider();
    await provider.initialize();
    console.log(`✅ Payment provider initialized: ${provider.getProviderName()}`);
  }
}
