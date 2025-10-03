import { apiRequest } from './apiClient';

export const cartApi = {
  // Get user's cart
  getCart: async () => {
    try {
      const response = await apiRequest.get('/cart');
      return response.cart || { items: [], total: 0 };
    } catch (error) {
      throw error;
    }
  },

  // Add item to cart
  addToCart: async (item) => {
    try {
      const response = await apiRequest.post('/cart/items', item);
      return response.cart;
    } catch (error) {
      throw error;
    }
  },

  // Update cart item
  updateCartItem: async (itemId, updateData) => {
    try {
      const response = await apiRequest.put(`/cart/items/${itemId}`, updateData);
      return response.cart;
    } catch (error) {
      throw error;
    }
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    try {
      const response = await apiRequest.delete(`/cart/items/${itemId}`);
      return response.cart;
    } catch (error) {
      throw error;
    }
  },

  // Clear entire cart
  clearCart: async () => {
    try {
      const response = await apiRequest.delete('/cart');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update item quantity
  updateQuantity: async (itemId, quantity) => {
    try {
      const response = await apiRequest.patch(`/cart/items/${itemId}/quantity`, { quantity });
      return response.cart;
    } catch (error) {
      throw error;
    }
  },

  // Apply coupon/discount
  applyCoupon: async (couponCode) => {
    try {
      const response = await apiRequest.post('/cart/coupon', { couponCode });
      return response.cart;
    } catch (error) {
      throw error;
    }
  },

  // Remove coupon
  removeCoupon: async () => {
    try {
      const response = await apiRequest.delete('/cart/coupon');
      return response.cart;
    } catch (error) {
      throw error;
    }
  },

  // Get cart summary
  getCartSummary: async () => {
    try {
      const response = await apiRequest.get('/cart/summary');
      return response.summary;
    } catch (error) {
      throw error;
    }
  },

  // Validate cart before checkout
  validateCart: async () => {
    try {
      const response = await apiRequest.post('/cart/validate');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Sync local cart with server (for offline support)
  syncCart: async (localCartItems) => {
    try {
      const response = await apiRequest.post('/cart/sync', { items: localCartItems });
      return response.cart;
    } catch (error) {
      throw error;
    }
  },

  // Get cart item count
  getCartItemCount: async () => {
    try {
      const cart = await cartApi.getCart();
      return cart.items?.reduce((total, item) => total + (item.quantity || 1), 0) || 0;
    } catch (error) {
      return 0;
    }
  },

  // Check if item exists in cart
  isItemInCart: async (itemId, itemType) => {
    try {
      const cart = await cartApi.getCart();
      return cart.items?.some(item => 
        item.itemId === itemId && item.itemType === itemType
      ) || false;
    } catch (error) {
      return false;
    }
  },

  // Basket-specific methods (for temple store items)
  basket: {
    // Add product to basket
    addProduct: async (productData) => {
      try {
        const response = await apiRequest.post('/cart/basket/products', productData);
        return response.cart;
      } catch (error) {
        throw error;
      }
    },

    // Update product in basket
    updateProduct: async (productId, updateData) => {
      try {
        const response = await apiRequest.put(`/cart/basket/products/${productId}`, updateData);
        return response.cart;
      } catch (error) {
        throw error;
      }
    },

    // Remove product from basket
    removeProduct: async (productId) => {
      try {
        const response = await apiRequest.delete(`/cart/basket/products/${productId}`);
        return response.cart;
      } catch (error) {
        throw error;
      }
    },

    // Get basket items
    getBasketItems: async () => {
      try {
        const cart = await cartApi.getCart();
        return cart.items?.filter(item => item.itemType === 'product') || [];
      } catch (error) {
        return [];
      }
    },
  },
};

export default cartApi;