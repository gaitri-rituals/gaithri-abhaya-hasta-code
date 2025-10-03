import { apiRequest } from './apiClient';

export const referenceAPI = {
  // Get all nakshatras
  getNakshatras: async () => {
    try {
      const response = await apiRequest.get('/reference/nakshatras');
      return response;
    } catch (error) {
      console.error('Error fetching nakshatras:', error);
      throw error;
    }
  },

  // Get all gothras
  getGothras: async () => {
    try {
      const response = await apiRequest.get('/reference/gothras');
      return response;
    } catch (error) {
      console.error('Error fetching gothras:', error);
      throw error;
    }
  }
};

export default referenceAPI;