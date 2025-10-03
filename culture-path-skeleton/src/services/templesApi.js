import { apiRequest } from './apiClient';

export const templesApi = {
  // Get all temples
  getAllTemples: async () => {
    try {
      const response = await apiRequest.get('/temples');
      return response.temples || [];
    } catch (error) {
      throw error;
    }
  },

  // Get temple by ID
  getTempleById: async (templeId) => {
    try {
      const response = await apiRequest.get(`/temples/${templeId}`);
      return response.temple;
    } catch (error) {
      throw error;
    }
  },

  // Get temples by location/city
  getTemplesByLocation: async (location) => {
    try {
      const response = await apiRequest.get(`/temples/location/${location}`);
      return response.temples || [];
    } catch (error) {
      throw error;
    }
  },

  // Search temples
  searchTemples: async (query) => {
    try {
      const response = await apiRequest.get(`/temples/search?q=${encodeURIComponent(query)}`);
      return response.temples || [];
    } catch (error) {
      throw error;
    }
  },

  // Get temple services/pujas
  getTempleServices: async (templeId) => {
    try {
      const response = await apiRequest.get(`/temples/${templeId}/services`);
      return response.services || [];
    } catch (error) {
      throw error;
    }
  },

  // Get temple events
  getTempleEvents: async (templeId) => {
    try {
      const response = await apiRequest.get(`/temples/${templeId}/events`);
      return response.events || [];
    } catch (error) {
      throw error;
    }
  },

  // Get temple classes
  getTempleClasses: async (templeId) => {
    try {
      const response = await apiRequest.get(`/temples/${templeId}/classes`);
      return response.classes || [];
    } catch (error) {
      throw error;
    }
  },

  // Get temple donations
  getTempleDonations: async (templeId) => {
    try {
      const response = await apiRequest.get(`/temples/${templeId}/donations`);
      return response.donations || [];
    } catch (error) {
      throw error;
    }
  },

  // Get temple timings
  getTempleTimings: async (templeId) => {
    try {
      const response = await apiRequest.get(`/temples/${templeId}/timings`);
      return response.timings;
    } catch (error) {
      throw error;
    }
  },

  // Get temple gallery
  getTempleGallery: async (templeId) => {
    try {
      const response = await apiRequest.get(`/temples/${templeId}/gallery`);
      return response.gallery || [];
    } catch (error) {
      throw error;
    }
  },

  // Get temple reviews
  getTempleReviews: async (templeId) => {
    try {
      const response = await apiRequest.get(`/temples/${templeId}/reviews`);
      return response.reviews || [];
    } catch (error) {
      throw error;
    }
  },

  // Add temple review
  addTempleReview: async (templeId, reviewData) => {
    try {
      const response = await apiRequest.post(`/temples/${templeId}/reviews`, reviewData);
      return response.review;
    } catch (error) {
      throw error;
    }
  },

  // Get user's favorite temples
  getFavoriteTemples: async () => {
    try {
      const response = await apiRequest.get('/user/favorites/temples');
      return response.favorites || [];
    } catch (error) {
      throw error;
    }
  },

  // Add temple to favorites
  addToFavorites: async (templeId) => {
    try {
      const response = await apiRequest.post('/user/favorites/temples', { templeId });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Remove temple from favorites
  removeFromFavorites: async (templeId) => {
    try {
      const response = await apiRequest.delete(`/user/favorites/temples/${templeId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Check if temple is in favorites
  isFavorite: async (templeId) => {
    try {
      const favorites = await templesApi.getFavoriteTemples();
      return favorites.some(fav => fav.templeId === templeId || fav._id === templeId);
    } catch (error) {
      return false;
    }
  },
};

export default templesApi;