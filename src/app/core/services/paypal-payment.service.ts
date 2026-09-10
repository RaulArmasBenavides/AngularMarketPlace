import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IPaymentProvider } from './payment-provider.interface';
import { PaymentIntent, PaymentMethod } from 'src/app/models/payment.model';

declare global {
  interface Window {
    paypal?: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PaypalPaymentService implements IPaymentProvider {
  private readonly apiUrl = environment.marketPlaceUrl;

  constructor(private http: HttpClient) {}

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypal.clientId}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
      document.head.appendChild(script);
    });
  }

  createPaymentIntent(amount: number, orderId: string): Observable<PaymentIntent> {
    return this.http.post<PaymentIntent>(`${this.apiUrl}/payments/create-intent`, {
      amount,
      orderId,
      provider: 'paypal',
    });
  }

  processPayment(paymentIntentId: string, paymentDetails: any): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/payments/process`, {
      paymentIntentId,
      provider: 'paypal',
      ...paymentDetails,
    });
  }

  getSavedPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/payments/methods`);
  }

  savePaymentMethod(paymentDetails: any): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(`${this.apiUrl}/payments/methods`, {
      provider: 'paypal',
      ...paymentDetails,
    });
  }

  deletePaymentMethod(paymentMethodId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/payments/methods/${paymentMethodId}`);
  }

  getProviderName(): string {
    return 'PayPal';
  }

  /**
   * PayPal-specific: Initialize PayPal buttons
   */
  initializePayPalButtons(containerSelector: string, onApprove: (details: any) => void): void {
    if (!window.paypal) {
      throw new Error('PayPal SDK not loaded');
    }

    window.paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: data.amount,
            },
          }],
        });
      },
      onApprove: (data: any, actions: any) => {
        return actions.order.capture().then((details: any) => {
          onApprove(details);
        });
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
      },
    }).render(containerSelector);
  }
}
