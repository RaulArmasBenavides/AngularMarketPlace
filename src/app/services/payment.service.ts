import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  // Crear intent de pago (Stripe o PayPal)
  createPaymentIntent(
    amount: number,
    orderId: string,
    provider: 'stripe' | 'paypal'
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-intent`, {
      amount,
      orderId,
      provider,
    });
  }

  // Procesar pago
  processPayment(payload: {
    paymentIntentId: string;
    provider: 'stripe' | 'paypal';
    payerId?: string;
    shippingAddress: any;
    items: any[];
    subtotal: number;
    shipping: number;
    tax: number;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/process`, payload);
  }

  // Obtener órdenes del usuario
  getOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders`);
  }

  // Obtener detalles de una orden
  getOrderDetails(orderId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/${orderId}`);
  }

  // Obtener métodos de pago guardados
  getPaymentMethods(): Observable<any> {
    return this.http.get(`${this.apiUrl}/methods`);
  }

  // Guardar método de pago
  savePaymentMethod(method: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/methods`, method);
  }

  // Eliminar método de pago
  deletePaymentMethod(methodId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/methods/${methodId}`);
  }

  // Obtener payerId desde URL después de autorizar en PayPal
  getPayerIdFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('payerId');
  }

  // Obtener token de PayPal (para cliente SDK)
  initializePayPal(): void {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${this.getPayPalClientId()}`;
    script.async = true;
    document.body.appendChild(script);
  }

  private getPayPalClientId(): string {
    // Esto normalmente vendría del backend o configuración
    return localStorage.getItem('paypalClientId') || 'YOUR_CLIENT_ID';
  }
}
