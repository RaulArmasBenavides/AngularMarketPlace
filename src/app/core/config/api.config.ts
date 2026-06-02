/**
 * API Configuration
 *
 * Switch between Mock Data and Real Backend easily
 * Set USE_MOCK_DATA to false to use real backend
 * Set USE_MOCK_DATA to true to use local JSON files
 */

/**
 * ⚙️ CONFIGURATION
 *
 * true  = Use MockDataService (local JSON files)
 * false = Use backend API (Firebase or your server)
 */
export const USE_MOCK_DATA = true;

/**
 * Backend API URLs
 * Change these when you have a real backend
 */
export const API_CONFIG = {
  // Firebase (current backend)
  firebase: 'https://marketplace-16c58.firebaseio.com/',

  // Your backend URLs (update these)
  production: 'https://api.marketplace.com/',
  staging: 'https://staging-api.marketplace.com/',
  development: 'http://localhost:3000/',

  // Assets (mock data)
  mockData: '/assets/data/'
};

/**
 * Get the appropriate API URL based on configuration
 */
export function getApiUrl(): string {
  if (USE_MOCK_DATA) {
    return API_CONFIG.mockData;
  }

  // Choose based on environment
  if (window.location.hostname === 'localhost') {
    return API_CONFIG.development;
  }

  if (window.location.hostname.includes('staging')) {
    return API_CONFIG.staging;
  }

  return API_CONFIG.production;
}

/**
 * Log configuration (visible in browser console)
 */
export function logApiConfig(): void {
  console.log('🔧 API Configuration:');
  console.log('USE_MOCK_DATA:', USE_MOCK_DATA);
  console.log('API URL:', getApiUrl());
  console.log('Hostname:', window.location.hostname);
}
