import { apiRequest, setTokens, clearTokens } from './apiClient';

export const authApi = {
  // Login with phone number (OTP-based) - Send OTP
  login: async (phone) => {
    try {
      // Remove country code prefix and keep only 10 digits
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const response = await apiRequest.post('/auth/otp/send', { phone: cleanPhone });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Verify OTP and complete login
  verifyOTP: async (phone, otp) => {
    try {
      // Remove country code prefix and keep only 10 digits
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const response = await apiRequest.post('/auth/otp/verify', { phone: cleanPhone, otp });
      
      if (response.success && response.data) {
        // Store tokens and user data
        setTokens(response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
        };
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await apiRequest.post('/auth/register', userData);
      
      if (response.success && response.token) {
        // Store tokens and user data
        setTokens(response.token, response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    try {
      const response = await apiRequest.post('/auth/refresh-token', { refreshToken });
      
      if (response.success && response.token) {
        setTokens(response.token, response.refreshToken);
        return response;
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      // Call backend logout if needed
      await apiRequest.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if backend call fails
      console.warn('Backend logout failed:', error);
    } finally {
      // Clear local storage
      clearTokens();
      localStorage.removeItem('user');
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await apiRequest.get('/auth/profile');
      
      if (response.success && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        return response.user;
      }
      
      return null;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await apiRequest.put('/auth/profile', userData);
      
      if (response.success && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        return response.user;
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Get auth token from localStorage
  getAuthToken: () => {
    return localStorage.getItem('authToken');
  },
};

export default authApi;