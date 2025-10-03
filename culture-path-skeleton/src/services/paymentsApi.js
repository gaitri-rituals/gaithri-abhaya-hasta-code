import { apiRequest } from './apiClient';

export const paymentsApi = {
  // Create payment order
  createPaymentOrder: async (orderData) => {
    try {
      const response = await apiRequest.post('/payments/create-order', orderData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    try {
      const response = await apiRequest.post('/payments/verify', paymentData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get payment history
  getPaymentHistory: async () => {
    try {
      const response = await apiRequest.get('/payments/history');
      return response.payments || [];
    } catch (error) {
      throw error;
    }
  },

  // Get payment by ID
  getPaymentById: async (paymentId) => {
    try {
      const response = await apiRequest.get(`/payments/${paymentId}`);
      return response.payment;
    } catch (error) {
      throw error;
    }
  },

  // Refund payment
  refundPayment: async (paymentId, refundData) => {
    try {
      const response = await apiRequest.post(`/payments/${paymentId}/refund`, refundData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get refund status
  getRefundStatus: async (refundId) => {
    try {
      const response = await apiRequest.get(`/payments/refunds/${refundId}`);
      return response.refund;
    } catch (error) {
      throw error;
    }
  },

  // Donation-specific payment methods
  donations: {
    // Create donation payment
    createDonationPayment: async (donationData) => {
      try {
        const response = await apiRequest.post('/payments/donations/create-order', donationData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Verify donation payment
    verifyDonationPayment: async (paymentData) => {
      try {
        const response = await apiRequest.post('/payments/donations/verify', paymentData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Get donation history
    getDonationHistory: async () => {
      try {
        const response = await apiRequest.get('/payments/donations/history');
        return response.donations || [];
      } catch (error) {
        throw error;
      }
    },
  },

  // Booking-specific payment methods
  bookings: {
    // Create booking payment
    createBookingPayment: async (bookingData) => {
      try {
        const response = await apiRequest.post('/payments/bookings/create-order', bookingData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Verify booking payment
    verifyBookingPayment: async (paymentData) => {
      try {
        const response = await apiRequest.post('/payments/bookings/verify', paymentData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Get booking payment history
    getBookingPaymentHistory: async () => {
      try {
        const response = await apiRequest.get('/payments/bookings/history');
        return response.payments || [];
      } catch (error) {
        throw error;
      }
    },
  },

  // Store/Product payment methods
  store: {
    // Create store payment
    createStorePayment: async (orderData) => {
      try {
        const response = await apiRequest.post('/payments/store/create-order', orderData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Verify store payment
    verifyStorePayment: async (paymentData) => {
      try {
        const response = await apiRequest.post('/payments/store/verify', paymentData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    // Get store order history
    getStoreOrderHistory: async () => {
      try {
        const response = await apiRequest.get('/payments/store/history');
        return response.orders || [];
      } catch (error) {
        throw error;
      }
    },
  },

  // Utility methods for Razorpay integration
  razorpay: {
    // Load Razorpay script
    loadRazorpayScript: () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    },

    // Open Razorpay checkout
    openCheckout: async (options) => {
      const isLoaded = await paymentsApi.razorpay.loadRazorpayScript();
      
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      return new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          ...options,
          handler: (response) => {
            resolve(response);
          },
          modal: {
            ondismiss: () => {
              reject(new Error('Payment cancelled by user'));
            },
          },
        });

        razorpay.open();
      });
    },

    // Process payment with Razorpay
    processPayment: async (orderData) => {
      try {
        // Create order on backend
        const order = await paymentsApi.createPaymentOrder(orderData);

        // Open Razorpay checkout
        const paymentResponse = await paymentsApi.razorpay.openCheckout({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'Abhaya Hasta',
          description: orderData.description || 'Payment',
          order_id: order.id,
          prefill: {
            name: orderData.customerName,
            email: orderData.customerEmail,
            contact: orderData.customerPhone,
          },
          theme: {
            color: '#3399cc',
          },
        });

        // Verify payment on backend
        const verification = await paymentsApi.verifyPayment({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          orderType: orderData.orderType,
          orderId: orderData.orderId,
        });

        return verification;
      } catch (error) {
        throw error;
      }
    },
  },
};

export default paymentsApi;