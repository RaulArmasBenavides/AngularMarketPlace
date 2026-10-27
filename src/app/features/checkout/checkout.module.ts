import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { CheckoutComponent } from './pages/checkout.component';
import { OrderConfirmationComponent } from './order-confirmation/order-confirmation.component';

const routes: Routes = [
  {
    path: '',
    component: CheckoutComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'order-confirmation/:id',
    component: OrderConfirmationComponent,
    canActivate: [AuthGuard]
  }
];

// Los componentes son standalone: se importan, no se declaran.
@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), CheckoutComponent, OrderConfirmationComponent]
})
export class CheckoutModule {}
