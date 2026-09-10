import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IPaymentProvider } from './payment-provider.interface';
import { PaymentIntent, PaymentMethod } from 'src/app/models/payment.model';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';

@Injectable({
  providedIn: 'root'
})
export class StripePaymentService implements IPaymentProvider {
  private stripe: Stripe | null = null;
  private cardElement: StripeCardElement | null = null;
  private readonly apiUrl = environment.marketPlaceUrl;

  constructor(private http: HttpClient) {}

  async initialize(): Promise<void> {
    this.stripe = await loadStripe(environment.stripe.publishableKey);
    if (!this.stripe) {
      throw new Error('Failed to load Stripe');
    }
  }

  createPaymentIntent(amount: number, orderId: string): Observable<PaymentIntent> {
    return this.http.post<PaymentIntent>(`${this.apiUrl}/payments/create-intent`, {
      amount: Math.round(amount * 100), // Convert to cents
      orderId,
      provider: 'stripe',
    });
  }

  processPayment(paymentIntentId: string, paymentDetails: any): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/payments/process`, {
      paymentIntentId,
      provider: 'stripe',
      ...paymentDetails,
    });
  }

  getSavedPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/payments/methods`);
  }

  savePaymentMethod(paymentDetails: any): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(`${this.apiUrl}/payments/methods`, {
      provider: 'stripe',
      ...paymentDetails,
    });
  }

  deletePaymentMethod(paymentMethodId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/payments/methods/${paymentMethodId}`);
  }

  getProviderName(): string {
    return 'Stripe';
  }

  /**
   * Stripe-specific: Get Stripe instance
   */
  getStripe(): Stripe | null {
    return this.stripe;
  }

  /**
   * Stripe-specific: Create card element
   */
  async createCardElement(elementContainer: HTMLElement): Promise<StripeCardElement | null> {
    if (!this.stripe) {
      await this.initialize();
    }

    if (this.stripe) {
      const elements = this.stripe.elements();
      this.cardElement = elements.create('card');
      this.cardElement.mount(elementContainer);
      return this.cardElement;
    }
    return null;
  }

  /**
   * Stripe-specific: Confirm card payment
   */
  async confirmCardPayment(clientSecret: string): Promise<any> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }
    return this.stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: this.cardElement!,
      },
    });
  }
}
