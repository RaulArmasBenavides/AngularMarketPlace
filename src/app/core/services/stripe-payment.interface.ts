import { Stripe, StripeCardElement } from '@stripe/stripe-js';
import { IPaymentProvider } from './payment-provider.interface';

export interface IStripePaymentProvider extends IPaymentProvider {
  /**
   * Get Stripe instance
   */
  getStripe(): Stripe | null;

  /**
   * Create and mount a Stripe card element
   */
  createCardElement(elementContainer: HTMLElement): Promise<StripeCardElement | null>;

  /**
   * Confirm card payment with Stripe
   */
  confirmCardPayment(clientSecret: string): Promise<any>;
}
