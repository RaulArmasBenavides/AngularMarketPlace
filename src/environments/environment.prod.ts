export const environment = {
	production: true,
	marketPlaceUrl: 'https://api.marketplace.com',
	assets: 'https://cdn.marketplace.com/assets/',

	// Payment Provider: 'stripe' | 'paypal' (puede ser ENV variable)
	paymentProvider: 'stripe',

	// Stripe Configuration
	stripe: {
		publishableKey: 'pk_live_YOUR_STRIPE_KEY_HERE',
	},

	// PayPal Configuration
	paypal: {
		clientId: 'YOUR_PAYPAL_CLIENT_ID_HERE',
		currency: 'USD',
	},
};
