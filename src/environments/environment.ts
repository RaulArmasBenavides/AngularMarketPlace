// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
	production: false,
	marketPlaceUrl: 'http://localhost:3000/api',
	assets: 'http://localhost:4200/assets/',

	// Payment Provider: 'stripe' | 'paypal'
	paymentProvider: 'stripe',

	// Stripe Configuration
	stripe: {
		publishableKey: 'pk_test_YOUR_STRIPE_KEY_HERE',
	},

	// PayPal Configuration
	paypal: {
		clientId: 'YOUR_PAYPAL_CLIENT_ID_HERE',
		currency: 'USD',
	},
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
