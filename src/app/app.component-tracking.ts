/**
 * APP INITIALIZATION - TRACKING SETUP
 *
 * Add this to your app.component.ts
 */

import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from './core/services/analytics.service';
import { AuthService } from './core/services/auth.service';
import { ProductCatalogService } from './core/services/product-catalog.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent implements OnInit {
  items: MasonryItem[] = [];
  activeFilter: string = '*';

  constructor(
    private analyticsService: AnalyticsService,
    private authService: AuthService,
    private catalogService: ProductCatalogService
  ) {}

  ngOnInit(): void {
    // Initialize component state

    // 1. Initialize Analytics (Google Analytics 4 + Meta Pixel)
    console.log('✅ Analytics Service initialized');

    // 2. Set user properties if authenticated
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.analyticsService.setUserProperties(
        currentUser.id,
        currentUser.email,
        currentUser.phone
      );
    }

    // 3. Inject JSON-LD Organization Schema for Google
    const organizationSchema = this.catalogService.generateOrganizationSchema();
    this.catalogService.injectSchema(organizationSchema);

    // 4. Track initial page view
    this.analyticsService.trackPageView(
      window.location.pathname,
      document.title
    );
  }

  /**
   * Generate and download product feeds for:
   * - Google Shopping
   * - Facebook Catalog
   */
  generateProductFeeds(products: any[]): void {
    // Google Shopping Feed
    const googleFeed = this.catalogService.generateGoogleShoppingFeed(products);
    console.log('Google Shopping Feed generated');

    // Facebook Catalog Feed
    const facebookFeed = this.catalogService.generateFacebookCatalogFeed(products);
    console.log('Facebook Catalog Feed generated');

    // You can upload these feeds to:
    // - Google Merchant Center (Google Shopping)
    // - Meta Business Suite (Facebook/Instagram Catalog)
  }
}
