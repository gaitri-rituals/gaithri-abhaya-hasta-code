import { apiRequest } from './apiClient';

export const bookingsApi = {
  // Create a new booking
  createBooking: async (bookingData) => {
    try {
      const response = await apiRequest.post('/bookings', bookingData);
      return response.booking;
    } catch (error) {
      throw error;
    }
  },

  // Get user's bookings
  getUserBookings: async (status = null) => {
    try {
      const url = status ? `/bookings?status=${status}` : '/bookings';
      const response = await apiRequest.get(url);
      return response.bookings || [];
    } catch (error) {
      throw error;
    }
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    try {
      const response = await apiRequest.get(`/bookings/${bookingId}`);
      return response.booking;
    } catch (error) {
      throw error;
    }
  },

  // Update booking
  updateBooking: async (bookingId, updateData) => {
    try {
      const response = await apiRequest.put(`/bookings/${bookingId}`, updateData);
      return response.booking;
    } catch (error) {
      throw error;
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId, reason = '') => {
    try {
      const response = await apiRequest.patch(`/bookings/${bookingId}/cancel`, { reason });
      return response.booking;
    } catch (error) {
      throw error;
    }
  },

  // Get booking history
  getBookingHistory: async () => {
    try {
      const response = await apiRequest.get('/bookings/history');
      return response.bookings || [];
    } catch (error) {
      throw error;
    }
  },

  // Get upcoming bookings
  getUpcomingBookings: async () => {
    try {
      const response = await apiRequest.get('/bookings/upcoming');
      return response.bookings || [];
    } catch (error) {
      throw error;
    }
  },

  // Get completed bookings
  getCompletedBookings: async () => {
    try {
      const response = await apiRequest.get('/bookings/completed');
      return response.bookings || [];
    } catch (error) {
      throw error;
    }
  },

  // Puja-specific booking methods
  puja: {
    // Create puja booking
    createPujaBooking: async (pujaBookingData) => {
      try {
        const response = await apiRequest.post('/bookings/puja', pujaBookingData);
        return response.booking;
      } catch (error) {
        throw error;
      }
    },

    // Get available puja slots
    getAvailableSlots: async (templeId, pujaId, date) => {
      try {
        const response = await apiRequest.get(`/bookings/puja/slots?templeId=${templeId}&pujaId=${pujaId}&date=${date}`);
        return response.slots || [];
      } catch (error) {
        throw error;
      }
    },

    // Get puja booking details
    getPujaBooking: async (bookingId) => {
      try {
        const response = await apiRequest.get(`/bookings/puja/${bookingId}`);
        return response.booking;
      } catch (error) {
        throw error;
      }
    },

    // Update puja booking
    updatePujaBooking: async (bookingId, updateData) => {
      try {
        const response = await apiRequest.put(`/bookings/puja/${bookingId}`, updateData);
        return response.booking;
      } catch (error) {
        throw error;
      }
    },

    // Get user's puja bookings
    getUserPujaBookings: async () => {
      try {
        const response = await apiRequest.get('/bookings/puja/user');
        return response.bookings || [];
      } catch (error) {
        throw error;
      }
    },
  },

  // Temple visit booking methods
  temple: {
    // Create temple visit booking
    createTempleBooking: async (templeBookingData) => {
      try {
        const response = await apiRequest.post('/bookings/temple', templeBookingData);
        return response.booking;
      } catch (error) {
        throw error;
      }
    },

    // Get temple visit booking
    getTempleBooking: async (bookingId) => {
      try {
        const response = await apiRequest.get(`/bookings/temple/${bookingId}`);
        return response.booking;
      } catch (error) {
        throw error;
      }
    },

    // Update temple visit booking
    updateTempleBooking: async (bookingId, updateData) => {
      try {
        const response = await apiRequest.put(`/bookings/temple/${bookingId}`, updateData);
        return response.booking;
      } catch (error) {
        throw error;
      }
    },

    // Get user's temple visit bookings
    getUserTempleBookings: async () => {
      try {
        const response = await apiRequest.get('/bookings/temple/user');
        return response.bookings || [];
      } catch (error) {
        throw error;
      }
    },
  },

  // Class enrollment methods
  classes: {
    // Enroll in a class
    enrollInClass: async (classId, enrollmentData) => {
      try {
        const response = await apiRequest.post(`/classes/${classId}/enroll`, enrollmentData);
        return response.enrollment;
      } catch (error) {
        throw error;
      }
    },

    // Get user's class enrollments
    getUserEnrollments: async () => {
      try {
        const response = await apiRequest.get('/classes/enrollments');
        return response.enrollments || [];
      } catch (error) {
        throw error;
      }
    },

    // Update enrollment
    updateEnrollment: async (enrollmentId, updateData) => {
      try {
        const response = await apiRequest.put(`/classes/enrollments/${enrollmentId}`, updateData);
        return response.enrollment;
      } catch (error) {
        throw error;
      }
    },

    // Cancel enrollment
    cancelEnrollment: async (enrollmentId) => {
      try {
        const response = await apiRequest.delete(`/classes/enrollments/${enrollmentId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Get class progress
    getClassProgress: async (enrollmentId) => {
      try {
        const response = await apiRequest.get(`/classes/enrollments/${enrollmentId}/progress`);
        return response.progress;
      } catch (error) {
        throw error;
      }
    },

    // Update class progress
    updateClassProgress: async (enrollmentId, progressData) => {
      try {
        const response = await apiRequest.put(`/classes/enrollments/${enrollmentId}/progress`, progressData);
        return response.progress;
      } catch (error) {
        throw error;
      }
    },
  },
};

export default bookingsApi;