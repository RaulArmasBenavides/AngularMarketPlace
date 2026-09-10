import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from 'src/app/services/cart.service';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css'],
})
export class OrderConfirmationComponent implements OnInit {
  orderNumber = '';
  orderDate = new Date();
  estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  orderStatus = 'processing';

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.orderNumber = `ORD-${Date.now()}`;
    this.cartService.clearCart();
  }

  downloadInvoice(): void {
    alert('Invoice download feature coming soon');
  }

  trackOrder(): void {
    alert('Order tracking feature coming soon');
  }
}
