import { apiRequest } from './apiClient';

export const addressApi = {
  // Get all addresses for logged-in user
  getAll: async () => {
    try {
      const response = await apiRequest.get('/users/addresses');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Add new address
  add: async (addressData) => {
    try {
      const response = await apiRequest.post('/users/addresses', addressData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update existing address
  update: async (id, addressData) => {
    try {
      const response = await apiRequest.put(`/users/addresses/${id}`, addressData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete address
  delete: async (id) => {
    try {
      const response = await apiRequest.delete(`/users/addresses/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default addressApi;
