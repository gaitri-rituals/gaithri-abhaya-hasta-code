// API Configuration for Abhaya Hasta Consumer App
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  verifyOTP: (otpData) => apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(otpData),
  }),
  
  forgotPassword: (phone) => apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  }),
};

// Temple API
export const templeAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/temples${queryString ? '?' + queryString : ''}`);
  },
  
  getById: (id) => apiRequest(`/temples/${id}`),
  
  getNearby: (lat, lng, radius = 10) => 
    apiRequest(`/temples/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  
  getCategories: () => apiRequest('/temples/categories'),
  
  getByCategory: (category, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/temples/category/${category}${queryString ? '?' + queryString : ''}`);
  },
  
  getServices: (templeId) => apiRequest(`/temples/${templeId}/services`),
  
  // Favorites
  getFavorites: () => apiRequest('/temples/favorites'),
  
  addToFavorites: (templeId) => apiRequest('/temples/favorites', {
    method: 'POST',
    body: JSON.stringify({ temple_id: templeId }),
  }),
  
  removeFromFavorites: (templeId) => apiRequest(`/temples/favorites/${templeId}`, {
    method: 'DELETE',
  }),
};

// Booking API
export const bookingAPI = {
  create: (bookingData) => apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  }),
  
  getAll: () => apiRequest('/bookings'),
  
  getById: (id) => apiRequest(`/bookings/${id}`),
  
  cancel: (id) => apiRequest(`/bookings/${id}/cancel`, {
    method: 'PUT',
  }),
  
  getQRCode: (id) => apiRequest(`/bookings/${id}/qr`),
};

// Payment API
export const paymentAPI = {
  createOrder: (orderData) => apiRequest('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }),
  
  verifyPayment: (paymentData) => apiRequest('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }),
  
  getHistory: () => apiRequest('/payments/history'),
  
  requestRefund: (paymentId, reason) => apiRequest('/payments/refund', {
    method: 'POST',
    body: JSON.stringify({ payment_id: paymentId, reason }),
  }),
};

// User API
export const userAPI = {
  getProfile: () => apiRequest('/users/profile'),
  
  updateProfile: (userData) => apiRequest('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
  
  getAddresses: () => apiRequest('/users/addresses'),
  
  addAddress: (addressData) => apiRequest('/users/addresses', {
    method: 'POST',
    body: JSON.stringify(addressData),
  }),
  
  updateAddress: (id, addressData) => apiRequest(`/users/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(addressData),
  }),
  
  deleteAddress: (id) => apiRequest(`/users/addresses/${id}`, {
    method: 'DELETE',
  }),
};

// Class API
export const classAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/classes${queryString ? '?' + queryString : ''}`);
  },
  
  getById: (id) => apiRequest(`/classes/${id}`),
  
  enroll: (id, enrollmentData) => apiRequest(`/classes/${id}/enroll`, {
    method: 'POST',
    body: JSON.stringify(enrollmentData),
  }),
  
  getMyEnrollments: () => apiRequest('/classes/my-enrollments'),
};

// Store API
export const storeAPI = {
  getItems: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/store/items${queryString ? '?' + queryString : ''}`);
  },
  
  getItemById: (id) => apiRequest(`/store/items/${id}`),
  
  getCategories: () => apiRequest('/store/categories'),
  
  // Cart management
  addToCart: (itemId, quantity) => apiRequest('/store/cart', {
    method: 'POST',
    body: JSON.stringify({ item_id: itemId, quantity }),
  }),
  
  getCart: () => apiRequest('/store/cart'),
  
  updateCartItem: (itemId, quantity) => apiRequest(`/store/cart/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  }),
  
  removeFromCart: (itemId) => apiRequest(`/store/cart/${itemId}`, {
    method: 'DELETE',
  }),
  
  clearCart: () => apiRequest('/store/cart/clear', {
    method: 'DELETE',
  }),
  
  // Orders
  createOrder: () => apiRequest('/store/orders', {
    method: 'POST',
  }),
  
  getOrders: () => apiRequest('/store/orders'),
  
  getOrderById: (id) => apiRequest(`/store/orders/${id}`),
};

// Subscription API
export const subscriptionAPI = {
  getPlans: () => apiRequest('/subscriptions/plans'),
  
  subscribe: (planId, paymentData) => apiRequest('/subscriptions/subscribe', {
    method: 'POST',
    body: JSON.stringify({ plan_id: planId, ...paymentData }),
  }),
  
  getMySubscriptions: () => apiRequest('/subscriptions/my-subscriptions'),
  
  cancelSubscription: (id) => apiRequest(`/subscriptions/${id}/cancel`, {
    method: 'PUT',
  }),
};

// Events API
export const eventsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/events${queryString ? '?' + queryString : ''}`);
  },
  
  getById: (id) => apiRequest(`/events/${id}`),
  
  register: (eventId) => apiRequest(`/events/${eventId}/register`, {
    method: 'POST',
  }),
  
  getMyRegistrations: () => apiRequest('/events/my-registrations'),
  
  cancelRegistration: (eventId) => apiRequest(`/events/${eventId}/cancel`, {
    method: 'DELETE',
  }),
  
  getCategories: () => apiRequest('/events/categories'),
  
  getUpcoming: (templeId) => apiRequest(`/events/upcoming?temple_id=${templeId}`),
  
  getStats: () => apiRequest('/events/my-stats'),
};

// Community API
export const communityAPI = {
  getPosts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/community/posts${queryString ? '?' + queryString : ''}`);
  },
  
  getPostById: (id) => apiRequest(`/community/posts/${id}`),
  
  createPost: (postData) => apiRequest('/community/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  }),
  
  updatePost: (id, postData) => apiRequest(`/community/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(postData),
  }),
  
  deletePost: (id) => apiRequest(`/community/posts/${id}`, {
    method: 'DELETE',
  }),
  
  addComment: (postId, comment) => apiRequest(`/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content: comment }),
  }),
  
  updateComment: (postId, commentId, comment) => apiRequest(`/community/posts/${postId}/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ content: comment }),
  }),
  
  deleteComment: (postId, commentId) => apiRequest(`/community/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  }),
  
  getCategories: () => apiRequest('/community/categories'),
  
  getMyPosts: () => apiRequest('/community/my-posts'),
  
  getStats: () => apiRequest('/community/stats'),
};

// Reviews API
export const reviewsAPI = {
  getTempleReviews: (templeId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/reviews/temple/${templeId}${queryString ? '?' + queryString : ''}`);
  },
  
  getReviewById: (id) => apiRequest(`/reviews/${id}`),
  
  createReview: (reviewData) => apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData),
  }),
  
  updateReview: (id, reviewData) => apiRequest(`/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(reviewData),
  }),
  
  deleteReview: (id) => apiRequest(`/reviews/${id}`, {
    method: 'DELETE',
  }),
  
  getMyReviews: () => apiRequest('/reviews/my-reviews'),
  
  markHelpful: (id) => apiRequest(`/reviews/${id}/helpful`, {
    method: 'POST',
  }),
  
  getTempleStats: (templeId) => apiRequest(`/reviews/temple/${templeId}/stats`),
  
  getTopRated: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/reviews/top-rated${queryString ? '?' + queryString : ''}`);
  },
  
  getRecent: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/reviews/recent${queryString ? '?' + queryString : ''}`);
  },
};

// Puja API
export const pujaAPI = {
  getCategories: () => apiRequest('/pujas/categories'),
  
  getByCategory: (category) => apiRequest(`/pujas/category/${category}`),
  
  getById: (id) => apiRequest(`/pujas/${id}`),
};

// Reference Data API
export const referenceAPI = {
  getNakshatras: () => apiRequest('/reference/nakshatras'),
  getGothras: () => apiRequest('/reference/gothras'),
};

export default {
  auth: authAPI,
  temple: templeAPI,
  booking: bookingAPI,
  payment: paymentAPI,
  user: userAPI,
  class: classAPI,
  store: storeAPI,
  subscription: subscriptionAPI,
  events: eventsAPI,
  community: communityAPI,
  reviews: reviewsAPI,
  puja: pujaAPI,
  reference: referenceAPI,
};
