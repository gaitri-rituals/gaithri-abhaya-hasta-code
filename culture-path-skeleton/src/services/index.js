// Main API services export
export { default as apiClient, apiRequest, setTokens, clearTokens, getAuthToken, getRefreshToken } from './apiClient';
export { default as authApi } from './authApi';
export { default as templesApi } from './templesApi';
export { default as bookingsApi } from './bookingsApi';
export { default as cartApi } from './cartApi';
export { default as paymentsApi } from './paymentsApi';
export { default as ritualsApi } from './ritualsApi';
export { default as storeApi } from './storeApi';

// Re-export for convenience
export const api = {
  auth: authApi,
  temples: templesApi,
  bookings: bookingsApi,
  cart: cartApi,
  payments: paymentsApi,
  rituals: ritualsApi,
  store: storeApi,
};

export default api;