import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ShippingAddress } from 'src/app/models/payment.model';

export interface CreateOrderItem {
  productId: number;
  quantity: number;
}

export interface CreatedOrder {
  _id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'shipped' | 'delivered';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  subtotal: number;
  shipping: number;
  tax: number;
  totalAmount: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private readonly apiUrl = environment.marketPlaceUrl;

  constructor(private readonly http: HttpClient) {}

  /** El servidor recalcula precios y totales a partir de los productos. */
  create(items: CreateOrderItem[], shippingAddress: ShippingAddress): Observable<CreatedOrder> {
    return this.http.post<CreatedOrder>(`${this.apiUrl}orders`, { items, shippingAddress });
  }

  getById(id: string): Observable<CreatedOrder> {
    return this.http.get<CreatedOrder>(`${this.apiUrl}orders/${id}`);
  }
}
