# 📢 Advertising & Analytics Setup Guide

Complete guide to setup Google Analytics, Meta Pixel, Google Ads, and Product Catalogs.

## 🎯 Overview

This marketplace now tracks:
- ✅ Page views
- ✅ Product views
- ✅ Add to cart
- ✅ Remove from cart
- ✅ Checkout initiation
- ✅ Purchases (conversions)
- ✅ User data
- ✅ Custom events

## 📊 1. Google Analytics 4 Setup

### Step 1: Create Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com)
2. Click "Create Account"
3. Enter account details:
   - Account name: "Marketplace"
   - Data sharing settings: Enable all
4. Click "Next"

### Step 2: Create Property

1. Property name: "Marketplace Website"
2. Reporting timezone: Select your timezone
3. Currency: USD
4. Click "Next"

### Step 3: Create Data Stream

1. Platform: **Web**
2. Website URL: `http://localhost:4200`
3. Stream name: "Development"
4. **Copy the Measurement ID** (format: G-XXXXXXXXXX)

### Step 4: Add to Environment

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  // ...
  googleAnalyticsId: 'G-XXXXXXXXXX', // Paste here
};
```

### Step 5: Test

1. Run the app: `npm start`
2. Go to Google Analytics > Real-time > Overview
3. You should see your session!

---

## 📌 2. Meta Pixel (Facebook/Instagram Tracking) Setup

### Step 1: Create Pixel

1. Go to [Meta Business Suite](https://business.facebook.com)
2. Select your business
3. Go to **Events Manager**
4. Click **Create** > **Pixel**
5. Enter name: "Marketplace Pixel"
6. **Copy the Pixel ID** (format: 123456789)

### Step 2: Add to Environment

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  // ...
  metaPixelId: '123456789', // Paste here
};
```

### Step 3: Verify Pixel

1. Install [Meta Pixel Helper](https://chrome.google.com/webstore) Chrome extension
2. Run the app: `npm start`
3. Open browser DevTools
4. Go to Meta Pixel Helper > Check Status
5. You should see **Connected**

### Step 4: Create Conversion Events

In Meta Events Manager:

1. Click **Conversions**
2. For each event below, click **Set up conversion**:

| Event | Description |
|-------|-------------|
| ViewContent | Product page view |
| AddToCart | Item added to cart |
| InitiateCheckout | Checkout started |
| Purchase | Order completed |

---

## 🛍️ 3. Google Shopping Integration

### Step 1: Create Merchant Center Account

1. Go to [Google Merchant Center](https://merchants.google.com)
2. Click **Create new account**
3. Select country: Your country
4. Enter store name: "Marketplace"
5. Click **Continue**

### Step 2: Add Website

1. Enter your website URL
2. Verify ownership (choose method)
3. Click **Verify and continue**

### Step 3: Set Up Product Feed

1. Click **Products** > **Feeds**
2. Click **Create feed**
3. Choose:
   - Feed language: English
   - Target country: USA
   - Feed filename: `google-shopping-feed.xml`
4. Click **Create feed**

### Step 4: Upload Products

#### Option A: Manual Upload

```bash
# In your app.component.ts:
products: any[] = [...]; // Your products
feed = this.catalogService.generateGoogleShoppingFeed(products);
// Download and upload to Google Merchant Center
```

#### Option B: Automated Upload (Schedule)

```typescript
// In your backend (Node.js):
app.get('/api/feeds/google-shopping', (req, res) => {
  const products = getProductsFromDatabase();
  const feed = generateGoogleShoppingFeed(products);
  res.type('xml').send(feed);
});

// Then in Google Merchant Center:
// Settings > Feeds > Primary Feed
// URL: http://yourdomain.com/api/feeds/google-shopping
// Frequency: Daily
```

---

## 🎨 4. Facebook Catalog (Instagram Shopping)

### Step 1: Create Catalog

1. Go to [Meta Business Suite](https://business.facebook.com)
2. Select your business
3. Go to **Catalogs**
4. Click **Create catalog**
5. Select type: **Products**
6. **Copy the Catalog ID**

### Step 2: Add to Environment

```typescript
export const environment = {
  // ...
  facebookCatalogId: 'YOUR_CATALOG_ID',
};
```

### Step 3: Upload Products

```bash
# Option 1: Download CSV feed
const feed = this.catalogService.generateFacebookCatalogFeed(products);
this.catalogService.downloadFacebookCatalogFeed(products);

# Upload the CSV file to Meta Business Suite > Catalogs
```

### Step 4: Set Up Instagram Shopping

1. Go to **Catalogs** > Your catalog
2. Click **Instagram Sales Channel**
3. Click **Set up Instagram Shopping**
4. Follow the flow:
   - Connect Instagram account
   - Choose products to display
   - Review and publish

---

## 🎯 5. Google Ads Conversion Tracking

### Step 1: Create Google Ads Account

1. Go to [Google Ads](https://ads.google.com)
2. Click **Tools & Settings** > **Conversions**
3. Click **+** to create new conversion

### Step 2: Set Up Purchase Conversion

1. **Conversion name**: "Purchase"
2. **Category**: "Purchase"
3. **Value**: Check "Use different conversion values"
4. **Default value**: (leave empty - comes from event)
5. **Conversion counting**: "Every" (each purchase counts)
6. Click **Create and continue**

### Step 3: Get Conversion Label

1. Choose: **Use Google tag (gtag.js)**
2. **Copy the Conversion ID** (format: AW-XXXXXXXXX/CONVERSION_LABEL)

### Step 4: Add to Environment

```typescript
export const environment = {
  // ...
  googleAdsConversionId: 'AW-XXXXXXXXX/CONVERSION_LABEL',
};
```

### Step 5: Test Conversion

1. Run the app: `npm start`
2. Complete a purchase
3. Go to Google Ads > Conversions
4. You should see the conversion tracked

---

## 📈 6. Google Search Console (SEO)

### Step 1: Add Property

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add property**
3. Enter your website URL
4. **Verify ownership**

### Step 2: Submit Sitemap

1. Click **Sitemaps** (left menu)
2. Enter sitemap URL: `/sitemap.xml`
3. Click **Submit**

### Step 3: Monitor Performance

- **Performance** - Click impressions, CTR
- **Coverage** - Check for indexing errors
- **Core Web Vitals** - Monitor page speed

---

## 🔗  7. Data Structured (JSON-LD)

The app automatically injects JSON-LD schema for:

### Product Schema
```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Product Name",
  "description": "...",
  "image": "...",
  "offers": {
    "@type": "Offer",
    "price": 99.99,
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
```

### Organization Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Marketplace",
  "url": "https://yourdomain.com",
  "logo": "https://yourdomain.com/logo.png"
}
```

### Breadcrumb Schema
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [...]
}
```

These are automatically injected via `ProductCatalogService.injectSchema()`.

---

## 🚀 8. Testing & Verification

### Google Analytics
- [GA4 Debug View](https://support.google.com/analytics/answer/7201382) - Real-time events
- [GA4 Realtime Report](https://analytics.google.com) - Current activity

### Meta Pixel
- [Meta Pixel Helper](https://chrome.google.com/webstore) Chrome extension
- Check events in Events Manager > Conversions

### Google Ads
- Conversions tab shows real-time tracking
- Check "All conversions" report

### Google Shopping
- Merchant Center > Performance > Products
- Check impressions and clicks

---

## 📊 9. Campaign Setup Examples

### Google Ads Campaign

```
Campaign: "Marketplace Shopping"
Budget: $10/day
Bidding: Maximize conversions

Ad Group: "Product Category"
Keywords: "buy laptop", "purchase electronics"
Ad: "Shop our marketplace - Free shipping over $50"

Conversion tracking: Purchase conversion (from setup above)
```

### Facebook Ads Campaign

```
Campaign: "Retargeting Cart Abandoners"
Audience: Website visitors who added to cart but didn't purchase
Ad placement: Instagram, Facebook
Ad: "Complete your purchase! Your items are waiting"
Pixel event: Purchase conversion
```

### Instagram Shopping

```
Catalog: Your product catalog
Products: Shoppable posts
Tagging: Products in Instagram posts
Link: Direct to product page
Checkout: Native Instagram checkout
```

---

## 📋 Checklist

- [ ] Google Analytics 4 set up and configured
- [ ] Meta Pixel installed and verified
- [ ] Google Shopping feed created and uploaded
- [ ] Facebook Catalog created and connected
- [ ] Google Ads conversion tracking installed
- [ ] JSON-LD schemas injected on product pages
- [ ] Sitemap submitted to Google Search Console
- [ ] Test purchase tracked in all platforms
- [ ] Google Ads campaigns created
- [ ] Facebook/Instagram ads created
- [ ] Instagram Shopping set up

---

## 🔍 Monitoring & Optimization

### Weekly
- Check Google Analytics reports (top pages, traffic sources)
- Monitor conversion rates
- Check Meta Pixel data quality

### Monthly
- Review Google Shopping performance
- Optimize bids based on conversions
- Check Google Ads ROAS
- Analyze customer journey

### Quarterly
- Full audit of tracking setup
- Review and update product feeds
- Optimize audience targeting
- Calculate CAC (Customer Acquisition Cost)

---

## 💡 Tips

1. **Test with fake purchases** first (use test mode in Stripe/PayPal)
2. **Wait 24 hours** for data to appear in dashboards
3. **Use Debug View** in Google Analytics for real-time testing
4. **Keep feeds updated** - run daily to get latest products
5. **Monitor data quality** - check for tracking issues

---

## 🚨 Troubleshooting

### Pixel not firing events?
- Check Meta Pixel Helper shows "Connected"
- Verify Pixel ID in environment.ts
- Check browser console for errors

### Google Analytics shows no data?
- Verify Measurement ID in environment.ts
- Check GA4 Admin > Property > Data Streams
- Wait 24 hours for first data

### Conversions not tracked?
- Ensure AnalyticsService is initialized in AppComponent
- Verify conversion ID format in Google Ads
- Check Google Ads > Conversions > Conversion Action

### Products not showing in Google Shopping?
- Verify feed URL is accessible
- Check product data format (price, image required)
- Wait 48 hours for approval

---

**Questions?** Check:
- [Google Analytics Docs](https://support.google.com/analytics)
- [Meta Pixel Docs](https://www.facebook.com/business/help/952192354843008)
- [Google Merchant Center Docs](https://support.google.com/merchants)
- [Google Ads Docs](https://support.google.com/google-ads)
