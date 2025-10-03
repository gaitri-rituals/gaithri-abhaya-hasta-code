import { apiRequest } from './apiClient';

const BASKET_API_BASE = '/bookings/basket';

export const basketApi = {
  // Add service to basket
  addToBasket: async (basketData) => {
    try {
      const response = await apiRequest.post(`${BASKET_API_BASE}/add`, basketData);
      return response;
    } catch (error) {
      console.error('Error adding to basket:', error);
      throw error;
    }
  },

  // Get user's basket items
  getBasket: async () => {
    try {
      const response = await apiRequest.get(`${BASKET_API_BASE}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching basket:', error);
      throw error;
    }
  },

  // Update basket item
  updateBasketItem: async (basketItemId, updateData) => {
    try {
      const response = await apiRequest.put(`${BASKET_API_BASE}/${basketItemId}`, updateData);
      return response;
    } catch (error) {
      console.error('Error updating basket item:', error);
      throw error;
    }
  },

  // Remove item from basket
  removeFromBasket: async (basketItemId) => {
    try {
      const response = await apiRequest.delete(`${BASKET_API_BASE}/${basketItemId}`);
      return response;
    } catch (error) {
      console.error('Error removing from basket:', error);
      throw error;
    }
  },

  // Clear entire basket
  clearBasket: async () => {
    try {
      const response = await apiRequest.delete(`${BASKET_API_BASE}`);
      return response;
    } catch (error) {
      console.error('Error clearing basket:', error);
      throw error;
    }
  },

  // Checkout basket (convert to bookings)
  checkoutBasket: async (paymentMethod = 'razorpay') => {
    try {
      const response = await apiRequest.post(`${BASKET_API_BASE}/checkout`, { payment_method: paymentMethod });
      return response;
    } catch (error) {
      console.error('Error during basket checkout:', error);
      throw error;
    }
  }
};

export default basketApi;