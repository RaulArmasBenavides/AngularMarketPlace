import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService } from 'src/app/core/services/notification.service';
import { OrdersService } from 'src/app/core/services/orders.service';

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
  estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // estimado: 7 días
  orderStatus = 'pending';

  constructor(
    private route: ActivatedRoute,
    private ordersService: OrdersService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notificationService.showError('Pedido no encontrado');
      return;
    }

    this.ordersService.getById(id).subscribe({
      next: (order) => {
        this.orderNumber = order.orderNumber;
        this.orderDate = new Date(order.createdAt);
        this.orderStatus = order.status;
      },
      error: () => this.notificationService.showError('No se pudo cargar el pedido'),
    });
  }

  downloadInvoice(): void {
    alert('Invoice download feature coming soon');
  }

  trackOrder(): void {
    alert('Order tracking feature coming soon');
  }
}
