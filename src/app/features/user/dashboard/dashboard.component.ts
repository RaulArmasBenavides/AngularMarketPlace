import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  stats = {
    totalOrders: 5,
    totalSpent: 1250.50,
    lastOrder: '2 days ago',
    memberSince: 'January 2025',
  };

  orders = [
    { id: 1, number: 'ORD-2025-001', date: '2025-01-10', status: 'delivered', total: 250 },
    { id: 2, number: 'ORD-2025-002', date: '2025-01-08', status: 'shipped', total: 350 },
    { id: 3, number: 'ORD-2025-003', date: '2025-01-05', status: 'processing', total: 150 },
  ];

  addresses = [
    {
      id: 1,
      name: 'Home',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      isDefault: true,
    },
  ];

  activeTab = 'orders';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'delivered':
        return '#28a745';
      case 'shipped':
        return '#ffc107;';
      case 'processing':
        return '#667eea';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#999';
    }
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      // Redirect to login (handled by guard)
    });
  }
}
