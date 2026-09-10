import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface CatalogProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  link: string;
  image_link: string;
  availability: 'in stock' | 'out of stock' | 'preorder';
  condition: 'new' | 'used' | 'refurbished';
  brand?: string;
  category?: string;
  gtin?: string;
  mpn?: string;
  shipping?: {
    price: number;
    currency: string;
  };
  shipping_label?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductCatalogService {
  private readonly catalogUrl = environment.marketPlaceUrl;

  constructor(private http: HttpClient) {}

  /**
   * Generate Google Shopping Feed (XML format)
   */
  generateGoogleShoppingFeed(products: any[]): string {
    let xmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Marketplace Products</title>
    <link>${window.location.origin}</link>
    <description>Product feed for Google Shopping</description>`;

    products.forEach((product) => {
      xmlFeed += `
    <item>
      <g:id>${this.escapeXml(product.id)}</g:id>
      <title>${this.escapeXml(product.name)}</title>
      <description>${this.escapeXml(product.description || '')}</description>
      <link>${window.location.origin}/products/${product.id}</link>
      <g:image_link>${this.escapeXml(product.image)}</g:image_link>
      <g:price>${product.price} USD</g:price>
      <g:availability>${product.inStock ? 'in stock' : 'out of stock'}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Marketplace</g:brand>
      <g:product_category>${this.escapeXml(product.category || 'General')}</g:product_category>
      ${product.gtin ? `<g:gtin>${product.gtin}</g:gtin>` : ''}
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard</g:service>
        <g:price>10 USD</g:price>
      </g:shipping>
      <g:shipping_label>Standard US</g:shipping_label>
    </item>`;
    });

    xmlFeed += `
  </channel>
</rss>`;

    return xmlFeed;
  }

  /**
   * Generate Facebook Catalog Feed (CSV format)
   */
  generateFacebookCatalogFeed(products: any[]): string {
    let csvFeed = 'id,title,description,availability,condition,price,currency,image_link,link,brand,category\n';

    products.forEach((product) => {
      const row = [
        product.id,
        this.escapeCsv(product.name),
        this.escapeCsv(product.description || ''),
        product.inStock ? 'in stock' : 'out of stock',
        'new',
        product.price,
        'USD',
        product.image,
        `${window.location.origin}/products/${product.id}`,
        'Marketplace',
        this.escapeCsv(product.category || 'General'),
      ];

      csvFeed += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });

    return csvFeed;
  }

  /**
   * Generate JSON-LD for Google Rich Results (Product Schema)
   */
  generateProductSchema(product: any): any {
    return {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image,
      brand: {
        '@type': 'Brand',
        name: 'Marketplace',
      },
      offers: {
        '@type': 'Offer',
        url: `${window.location.origin}/products/${product.id}`,
        priceCurrency: 'USD',
        price: product.price,
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'Marketplace',
        },
      },
      aggregateRating: product.rating
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            ratingCount: product.reviewCount || 0,
          }
        : undefined,
    };
  }

  /**
   * Generate JSON-LD for Organization Schema
   */
  generateOrganizationSchema(): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Marketplace',
      url: window.location.origin,
      logo: `${window.location.origin}/assets/logo.png`,
      sameAs: [
        'https://www.facebook.com/marketplace',
        'https://www.instagram.com/marketplace',
        'https://www.twitter.com/marketplace',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        email: 'support@marketplace.com',
      },
    };
  }

  /**
   * Generate JSON-LD for Breadcrumb Navigation
   */
  generateBreadcrumbSchema(breadcrumbs: { name: string; url: string }[]): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
  }

  /**
   * Download Google Shopping Feed
   */
  downloadGoogleShoppingFeed(products: any[]): void {
    const feed = this.generateGoogleShoppingFeed(products);
    this.downloadFile(feed, 'google-shopping-feed.xml', 'application/xml');
  }

  /**
   * Download Facebook Catalog Feed
   */
  downloadFacebookCatalogFeed(products: any[]): void {
    const feed = this.generateFacebookCatalogFeed(products);
    this.downloadFile(feed, 'facebook-catalog-feed.csv', 'text/csv');
  }

  /**
   * Inject JSON-LD schema into page
   */
  injectSchema(schema: any): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /**
   * Private helper: Escape XML special characters
   */
  private escapeXml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Private helper: Escape CSV special characters
   */
  private escapeCsv(str: string): string {
    if (!str) return '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return str.replace(/"/g, '""');
    }
    return str;
  }

  /**
   * Private helper: Download file
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
