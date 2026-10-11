import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

interface GTagFunction {
  (command: 'js', timestamp: Date): void;
  (command: 'config', id: string, config?: Record<string, unknown>): void;
}

interface FacebookPixelQueue {
  callMethod?: Function;
  queue?: unknown[];
}

interface FacebookPixel extends FacebookPixelQueue {
  (...args: unknown[]): void;
  push: (args: unknown) => void;
  loaded?: boolean;
  version?: string;
}

declare global {
  interface Window {
    gtag?: GTagFunction;
    fbq?: FacebookPixel;
    dataLayer?: unknown[];
  }
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  constructor() {
    this.initializeAnalytics();
  }

  private initializeAnalytics(): void {
    this.loadGoogleAnalytics();
    this.loadMetaPixel();
  }

  private loadGoogleAnalytics(): void {
    if (!environment.googleAnalyticsId) {
      console.warn('Google Analytics ID not configured');
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${environment.googleAnalyticsId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    const gtag: GTagFunction = (...args: unknown[]) => {
      window.dataLayer!.push(args);
    };
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', environment.googleAnalyticsId);

    console.log('✅ Google Analytics 4 initialized');
  }

  private loadMetaPixel(): void {
    if (!environment.metaPixelId) {
      console.warn('Meta Pixel ID not configured');
      return;
    }

    const fbq: FacebookPixel = function (...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, args as unknown[]);
      } else {
        fbq.queue?.push(args);
      }
    } as FacebookPixel;

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);

    window.fbq!('init', environment.metaPixelId);
    window.fbq!('track', 'PageView');

    console.log('✅ Meta Pixel initialized');
  }

  /**
   * Track page view
   */
  trackPageView(pagePath: string, pageTitle: string): void {
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: pagePath,
        page_title: pageTitle,
      });
    }

    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }

  /**
   * Track product view
   */
  trackProductView(product: any): void {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'USD',
        value: product.price,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_brand: 'Marketplace',
            item_category: product.category,
            price: product.price,
            quantity: 1,
          },
        ],
      });
    }

    // Meta Pixel
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_id: product.id,
        content_name: product.name,
        content_type: 'product',
        value: product.price,
        currency: 'USD',
      });
    }
  }

  /**
   * Track add to cart
   */
  trackAddToCart(product: any, quantity = 1): void {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: product.price * quantity,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_brand: 'Marketplace',
            item_category: product.category,
            price: product.price,
            quantity: quantity,
          },
        ],
      });
    }

    // Meta Pixel
    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_id: product.id,
        content_name: product.name,
        content_type: 'product',
        value: product.price * quantity,
        currency: 'USD',
        content_category: product.category,
      });
    }
  }

  /**
   * Track remove from cart
   */
  trackRemoveFromCart(product: any, quantity = 1): void {
    if (window.gtag) {
      window.gtag('event', 'remove_from_cart', {
        currency: 'USD',
        value: product.price * quantity,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            price: product.price,
            quantity: quantity,
          },
        ],
      });
    }
  }

  /**
   * Track initiate checkout
   */
  trackInitiateCheckout(items: any[], total: number): void {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: total,
        items: items.map((item) => ({
          item_id: item.productId,
          item_name: item.productName,
          price: item.price,
          quantity: item.quantity,
        })),
      });
    }

    // Meta Pixel
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: total,
        currency: 'USD',
        num_items: items.length,
      });
    }
  }

  /**
   * Track purchase (conversion)
   */
  trackPurchase(orderData: any): void {
    const total = orderData.totalAmount;
    const items = orderData.items || [];

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: orderData.orderNumber,
        value: total,
        currency: 'USD',
        tax: orderData.tax || 0,
        shipping: orderData.shipping || 0,
        items: items.map((item: any) => ({
          item_id: item.productId,
          item_name: item.productName,
          item_category: item.category,
          price: item.price,
          quantity: item.quantity,
        })),
      });
    }

    // Meta Pixel
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        value: total,
        currency: 'USD',
        content_name: 'Order ' + orderData.orderNumber,
        content_type: 'product',
        content_ids: items.map((item: any) => item.productId),
      });
    }

    // Google Ads Conversion Tracking
    this.trackGoogleAdsConversion(orderData);
  }

  /**
   * Track Google Ads Conversion
   */
  private trackGoogleAdsConversion(orderData: any): void {
    if (!environment.googleAdsConversionId) {
      return;
    }

    // Load Google Ads script if not already loaded
    if (!document.querySelector('script[src*="googleadservices"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googleadservices.com/pagead/conversion.js';
      document.head.appendChild(script);
    }

    // Track conversion
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        allow_custom_scripts: true,
        send_to: environment.googleAdsConversionId,
        value: orderData.totalAmount,
        currency: 'USD',
        transaction_id: orderData.orderNumber,
      });
    }
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, eventData: any = {}): void {
    if (window.gtag) {
      window.gtag('event', eventName, eventData);
    }

    if (window.fbq) {
      window.fbq('trackCustom', eventName, eventData);
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(userId: string, userEmail?: string, phone?: string): void {
    // Google Analytics - Set user ID
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        user_id: userId,
      });

      // Set user properties
      window.gtag('event', 'user_engagement', {
        user_id: userId,
      });
    }

    // Meta Pixel - User data
    if (window.fbq) {
      window.fbq('setUserData', {
        em: userEmail ? this.hashEmail(userEmail) : undefined,
        ph: phone ? this.hashPhone(phone) : undefined,
        external_id: userId,
      });
    }
  }

  /**
   * Hash email for Meta Pixel (SHA256)
   */
  private hashEmail(email: string): string {
    // In production, use a proper SHA256 implementation
    // For now, return base64 encoded version
    return btoa(email.toLowerCase().trim());
  }

  /**
   * Hash phone for Meta Pixel (SHA256)
   */
  private hashPhone(phone: string): string {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    return btoa(cleaned);
  }
}
