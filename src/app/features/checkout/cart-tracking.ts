/**
 * TRACKING INTEGRATION FOR CART
 *
 * Add this to your cart component or cart-display component
 */

// In your cart component:
constructor(
  private cartService: CartService,
  private analyticsService: AnalyticsService  // ADD THIS
) {}

// When adding item to cart:
addToCart(product: any, quantity: number = 1): void {
  this.cartService.addItem({
    productId: product.id,
    productName: product.name,
    price: product.price,
    quantity,
    image: product.image,
  });

  // TRACK ADD TO CART (Google Analytics + Meta Pixel)
  this.analyticsService.trackAddToCart(product, quantity);
}

// When removing item from cart:
removeFromCart(productId: string, product: any, quantity: number): void {
  this.cartService.removeItem(productId);

  // TRACK REMOVE FROM CART
  this.analyticsService.trackRemoveFromCart(product, quantity);
}

// When viewing product details:
viewProduct(product: any): void {
  // TRACK PRODUCT VIEW (Google Analytics + Meta Pixel)
  this.analyticsService.trackProductView(product);
}
