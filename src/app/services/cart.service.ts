import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'cart_items';
  private cartItems = new BehaviorSubject<CartItem[]>(this.getCartFromStorage());
  public cartItems$ = this.cartItems.asObservable();

  private itemCount = new BehaviorSubject<number>(this.calculateItemCount());
  public itemCount$ = this.itemCount.asObservable();

  constructor() {}

  /**
   * Add item to cart
   */
  addItem(item: CartItem): void {
    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(i => i.productId === item.productId);

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      currentItems.push(item);
    }

    this.updateCart(currentItems);
  }

  /**
   * Remove item from cart
   */
  removeItem(productId: string): void {
    const currentItems = this.cartItems.value.filter(i => i.productId !== productId);
    this.updateCart(currentItems);
  }

  /**
   * Update item quantity
   */
  updateQuantity(productId: string, quantity: number): void {
    const currentItems = this.cartItems.value;
    const item = currentItems.find(i => i.productId === productId);

    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
        this.updateCart(currentItems);
      }
    }
  }

  /**
   * Clear cart
   */
  clearCart(): void {
    this.updateCart([]);
  }

  /**
   * Get cart items
   */
  getCartItems(): CartItem[] {
    return this.cartItems.value;
  }

  /**
   * Get cart totals
   */
  getCartTotals(): { subtotal: number; tax: number; shipping: number; total: number } {
    const subtotal = this.cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 50 ? 0 : 10; // Free shipping over $50

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shipping,
      total: Math.round((subtotal + tax + shipping) * 100) / 100,
    };
  }

  /**
   * Private: Update cart and save to storage
   */
  private updateCart(items: CartItem[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this.cartItems.next(items);
    this.itemCount.next(this.calculateItemCount());
  }

  /**
   * Private: Get cart from localStorage
   */
  private getCartFromStorage(): CartItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Private: Calculate total item count
   */
  private calculateItemCount(): number {
    return this.cartItems.value.reduce((sum, item) => sum + item.quantity, 0);
  }
}
