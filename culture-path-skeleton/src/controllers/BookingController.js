import { bookingAPI, paymentAPI } from '../services/api';

export class BookingController {
  // Booking Management
  static async createBooking(bookingData) {
    try {
      const response = await bookingAPI.create(bookingData);
      if (!response.success || !response.booking) {
        throw new Error(response.message || 'Failed to create booking');
      }
      return { success: true, booking: response.booking };
    } catch (error) {
      console.error('Error creating booking:', error);
      return { success: false, error: error.message };
    }
  }

  static async getBookings() {
    try {
      const response = await bookingAPI.getAll();
      if (!response.success || !response.bookings) {
        throw new Error(response.message || 'Failed to fetch bookings');
      }
      return { success: true, bookings: response.bookings };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return { success: false, error: error.message };
    }
  }

  static async getBookingById(bookingId) {
    try {
      const response = await bookingAPI.getById(bookingId);
      if (!response.success || !response.booking) {
        throw new Error(response.message || 'Failed to fetch booking');
      }
      return { success: true, booking: response.booking };
    } catch (error) {
      console.error('Error fetching booking:', error);
      return { success: false, error: error.message };
    }
  }

  static async cancelBooking(bookingId) {
    try {
      const response = await bookingAPI.cancel(bookingId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel booking');
      }
      return { success: true };
    } catch (error) {
      console.error('Error canceling booking:', error);
      return { success: false, error: error.message };
    }
  }

  static async getBookingQRCode(bookingId) {
    try {
      const response = await bookingAPI.getQRCode(bookingId);
      if (!response.success || !response.qrCode) {
        throw new Error(response.message || 'Failed to fetch booking QR code');
      }
      return { success: true, qrCode: response.qrCode };
    } catch (error) {
      console.error('Error fetching booking QR code:', error);
      return { success: false, error: error.message };
    }
  }

  // Payment Management
  static async createPayment(bookingId, amount) {
    try {
      const response = await paymentAPI.create({ bookingId, amount });
      if (!response.success || !response.order) {
        throw new Error(response.message || 'Failed to create payment order');
      }
      return { success: true, order: response.order };
    } catch (error) {
      console.error('Error creating payment:', error);
      return { success: false, error: error.message };
    }
  }

  static async verifyPayment(paymentId, orderId, signature) {
    try {
      const response = await paymentAPI.verify({
        paymentId,
        orderId,
        signature,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to verify payment');
      }
      return { success: true };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Razorpay Integration
  static async initializeRazorpay() {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  static async handlePayment(bookingData) {
    try {
      // Create booking first
      const bookingResponse = await this.createBooking(bookingData);
      if (!bookingResponse.success) {
        throw new Error(bookingResponse.error || 'Failed to create booking');
      }

      // Create payment order
      const paymentResponse = await this.createPayment(
        bookingResponse.booking.id,
        bookingData.amount
      );
      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || 'Failed to create payment order');
      }

      // Initialize Razorpay
      const razorpayLoaded = await this.initializeRazorpay();
      if (!razorpayLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Open Razorpay payment modal
      const options = {
        key: process.env.RAZORPAY_KEY_ID,
        amount: bookingData.amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: 'Abhaya Hasta',
        description: `Booking for ${bookingData.serviceName}`,
        order_id: paymentResponse.order.id,
        handler: async (response) => {
          try {
            // Verify payment
            const verificationResponse = await this.verifyPayment(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
            if (!verificationResponse.success) {
              throw new Error('Payment verification failed');
            }
            return { success: true, booking: bookingResponse.booking };
          } catch (error) {
            console.error('Payment verification error:', error);
            throw error;
          }
        },
        prefill: {
          name: bookingData.userDetails?.name,
          email: bookingData.userDetails?.email,
          contact: bookingData.userDetails?.phone,
        },
        theme: {
          color: '#F37254',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      return new Promise((resolve, reject) => {
        razorpay.on('payment.success', (response) => {
          resolve({ success: true, booking: bookingResponse.booking });
        });
        razorpay.on('payment.error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Payment process error:', error);
      return { success: false, error: error.message };
    }
  }
}