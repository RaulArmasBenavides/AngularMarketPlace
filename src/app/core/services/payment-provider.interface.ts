import { Observable } from 'rxjs';
import { PaymentIntent, PaymentMethod } from 'src/app/models/payment.model';

export interface IPaymentProvider {
  /**
   * Initialize payment provider with configuration
   */
  initialize(): Promise<void>;

  /**
   * Create a payment intent/order on the backend
   */
  createPaymentIntent(amount: number, orderId: string): Observable<PaymentIntent>;

  /**
   * Process payment with payment method details
   */
  processPayment(paymentIntentId: string, paymentDetails: any): Observable<{ success: boolean; message: string }>;

  /**
   * Get saved payment methods for user
   */
  getSavedPaymentMethods(): Observable<PaymentMethod[]>;

  /**
   * Save a payment method for future use
   */
  savePaymentMethod(paymentDetails: any): Observable<PaymentMethod>;

  /**
   * Delete a saved payment method
   */
  deletePaymentMethod(paymentMethodId: string): Observable<{ success: boolean }>;

  /**
   * Get provider name
   */
  getProviderName(): string;
}
