import { apiRequest } from './apiClient';

export const storeApi = {
  // Get all store items with optional filtering
  getItems: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiRequest.get(`/store/items${queryString ? '?' + queryString : ''}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching store items:', error);
      throw error;
    }
  },

  // Get store item by ID
  getItemById: async (itemId) => {
    try {
      const response = await apiRequest.get(`/store/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching store item:', error);
      throw error;
    }
  },

  // Get store categories
  getCategories: async () => {
    try {
      const response = await apiRequest.get('/store/categories');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching store categories:', error);
      throw error;
    }
  },

  // Cart management
  getCart: async () => {
    try {
      const response = await apiRequest.get('/store/cart');
      return response.data || { items: [], summary: { total_items: 0, total_amount: 0 } };
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },

  addToCart: async (itemId, quantity = 1) => {
    try {
      const response = await apiRequest.post('/store/cart', { item_id: itemId, quantity });
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  updateCartItem: async (cartItemId, quantity) => {
    try {
      const response = await apiRequest.put(`/store/cart/${cartItemId}`, { quantity });
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },

  removeFromCart: async (cartItemId) => {
    try {
      const response = await apiRequest.delete(`/store/cart/${cartItemId}`);
      return response;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  clearCart: async () => {
    try {
      const response = await apiRequest.delete('/store/cart');
      return response;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },

  // Order management
  createOrder: async (orderData) => {
    try {
      const response = await apiRequest.post('/store/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  getOrders: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiRequest.get(`/store/orders${queryString ? '?' + queryString : ''}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  getOrderById: async (orderId) => {
    try {
      const response = await apiRequest.get(`/store/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },
};

export default storeApi;
