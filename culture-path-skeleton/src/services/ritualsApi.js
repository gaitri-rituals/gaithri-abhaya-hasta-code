import { apiRequest } from './apiClient';

export const ritualsApi = {
  // Get all ritual categories
  getCategories: async () => {
    try {
      const response = await apiRequest.get('/rituals/categories');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching ritual categories:', error);
      throw error;
    }
  },

  // Get package configurations
  getPackageConfigurations: async () => {
    try {
      const response = await apiRequest.get('/rituals/packages-config');
      return response.data || {};
    } catch (error) {
      console.error('Error fetching package configurations:', error);
      throw error;
    }
  },

  // Get catering configurations
  getCateringConfigurations: async () => {
    try {
      const response = await apiRequest.get('/rituals/catering-config');
      return response.data || {};
    } catch (error) {
      console.error('Error fetching catering configurations:', error);
      throw error;
    }
  },

  // Get add-on services configurations
  getAddOnServicesConfigurations: async () => {
    try {
      const response = await apiRequest.get('/rituals/addons-config');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching add-on services configurations:', error);
      throw error;
    }
  },

  // Get all rituals with optional filtering
  getAllRituals: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiRequest.get(`/rituals${queryString ? '?' + queryString : ''}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching rituals:', error);
      throw error;
    }
  },

  // Get ritual by ID
  getRitualById: async (ritualId) => {
    try {
      const response = await apiRequest.get(`/rituals/${ritualId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ritual details:', error);
      throw error;
    }
  },

  // Get rituals by category
  getRitualsByCategory: async (category) => {
    try {
      const response = await apiRequest.get(`/rituals/category/${category}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching rituals by category:', error);
      throw error;
    }
  },

  // Get ritual packages/pricing tiers
  getRitualPackages: async (ritualId) => {
    try {
      const response = await apiRequest.get(`/rituals/${ritualId}/packages`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching ritual packages:', error);
      throw error;
    }
  },

  // Create ritual booking
  createBooking: async (bookingData) => {
    try {
      const response = await apiRequest.post('/rituals/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating ritual booking:', error);
      throw error;
    }
  },

  // Get user's ritual bookings
  getMyBookings: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiRequest.get(`/rituals/bookings/my-bookings${queryString ? '?' + queryString : ''}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching ritual bookings:', error);
      throw error;
    }
  },
};

export default ritualsApi;
