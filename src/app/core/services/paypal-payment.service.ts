import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PaymentDetails } from './payment-provider.interface';
import { IPaypalPaymentProvider } from './paypal-payment.interface';
import { PaymentIntent, PaymentMethod } from 'src/app/models/payment.model';

interface PayPalWindow extends Window {
  paypal?: {
    Buttons: (config: { createOrder: Function; onApprove: Function; onError: Function }) => { render: Function };
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaypalPaymentService implements IPaypalPaymentProvider {
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

  /** El monto lo toma el backend del total guardado en el pedido; `_amount` no se envía. */
  createPaymentIntent(_amount: number, orderId: string): Observable<PaymentIntent> {
    return this.http.post<PaymentIntent>(`${this.apiUrl}payments/create-intent`, {
      orderId,
      provider: 'paypal',
    });
  }

  /** Ejecuta el pago aprobado en PayPal y lo verifica en el backend. */
  processPayment(paymentId: string, paymentDetails: PaymentDetails): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}payments/confirm`, {
      orderId: paymentDetails['orderId'],
      provider: 'paypal',
      paymentId,
      payerId: paymentDetails['payerId'],
    });
  }

  getSavedPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}payments/methods`);
  }

  savePaymentMethod(paymentDetails: PaymentDetails): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(`${this.apiUrl}payments/methods`, {
      provider: 'paypal',
      ...paymentDetails,
    });
  }

  deletePaymentMethod(paymentMethodId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}payments/methods/${paymentMethodId}`);
  }

  getProviderName(): string {
    return 'PayPal';
  }

  initializePayPalButtons(containerSelector: string, onApprove: (details: PaymentDetails) => void): void {
    const paypalWindow = window as PayPalWindow;
    if (!paypalWindow.paypal) {
      throw new Error('PayPal SDK not loaded');
    }

    paypalWindow.paypal.Buttons({
      createOrder: (data: unknown, actions: { order: { create: Function } }) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: (data as Record<string, unknown>).amount,
            },
          }],
        });
      },
      onApprove: (data: unknown, actions: { order: { capture: Function } }) => {
        return actions.order.capture().then((details: PaymentDetails) => {
          onApprove(details);
        });
      },
      onError: (err: Error) => {
        console.error('PayPal error:', err);
      },
    }).render(containerSelector);
  }
}
