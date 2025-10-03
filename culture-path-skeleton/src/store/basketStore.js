import { create } from 'zustand';
import { basketApi } from '../services/basketApi.js';

const useBasketStore = create((set, get) => ({
  basketItems: [],
  basketSummary: null,
  loading: false,
  error: null,

  // Fetch basket items from API
  fetchBasket: async () => {
    set({ loading: true, error: null });
    try {
      const response = await basketApi.getBasket();
      
      // Handle different response formats
      let basketItems = [];
      let basketSummary = null;
      
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          // If response is directly an array
          basketItems = response;
        } else if (response.items && Array.isArray(response.items)) {
          // If response has items property with array
          basketItems = response.items;
          basketSummary = response.summary || null;
        } else if (response.data && Array.isArray(response.data)) {
          // If response has data property with array
          basketItems = response.data;
        }
      }
      
      // Transform API response to match UI expectations
      basketItems = basketItems.map(item => ({
        ...item,
        // Map API fields to UI expected fields
        amount: item.total_price || item.price || item.amount || 0,
        serviceName: item.service_name || item.serviceName,
        templeName: item.temple_name || item.templeName,
        totalAmount: item.total_price || item.totalAmount || (item.amount * (item.quantity || 1)),
        // Ensure quantity is a number
        quantity: parseInt(item.quantity) || 1,
        // Parse special_requests if it's a JSON string
        ...(item.special_requests && typeof item.special_requests === 'string' 
          ? (() => {
              try {
                const parsed = JSON.parse(item.special_requests);
                return {
                  serviceType: parsed.serviceType || item.serviceType,
                  devotees: parsed.devotees || item.devotees || [],
                  specialRequests: parsed.specialRequests || item.specialRequests
                };
              } catch (e) {
                return {};
              }
            })()
          : {}
        )
      }));
      
      set({ basketItems, basketSummary, loading: false });
      return basketItems;
    } catch (error) {
      set({ error: error.message, loading: false, basketItems: [], basketSummary: null });
      throw error;
    }
  },

  // Add service to basket
  addToBasket: async (serviceData) => {
    set({ loading: true, error: null });
    try {
      let transformedData;

      // Check if this is a puja booking or temple booking
      if (serviceData.puja || serviceData.serviceType === 'puja') {
        // Puja booking - send puja-specific data
        transformedData = {
          serviceType: 'puja',
          templeId: serviceData.templeId,
          pujaId: serviceData.puja?.id || serviceData.pujaId,
          pujaName: serviceData.puja?.name || serviceData.pujaName,
          amount: serviceData.amount,
          quantity: serviceData.quantity || 1,
          selectedDate: serviceData.selectedDate,
          selectedTime: serviceData.selectedTime,
          devoteeDetails: serviceData.devoteeDetails || {},
          specialRequests: serviceData.specialRequests || ''
        };
      } else if (serviceData.serviceType === 'temple') {
        // Temple service booking - pass through the data as received from TempleDetails
        transformedData = {
          serviceType: serviceData.serviceType,
          temple_id: serviceData.temple_id,
          service_id: serviceData.service_id,
          quantity: serviceData.quantity || 1,
          amount: serviceData.amount,
          totalAmount: serviceData.totalAmount || serviceData.amount,
          booking_date: serviceData.booking_date,
          booking_time: serviceData.booking_time,
          special_requests: serviceData.special_requests || '',
          devotee_details: serviceData.devotee_details || [],
          serviceName: serviceData.serviceName,
          templeName: serviceData.templeName,
          category: serviceData.category
        };
      } else {
        // Legacy temple service booking (dakshina, etc.)
        transformedData = {
          serviceType: 'temple_service',
          templeId: serviceData.templeId,
          serviceName: serviceData.serviceName || 'Temple Aarathi Dakshiney',
          amount: serviceData.amount,
          quantity: serviceData.quantity || 1,
          category: serviceData.category || 'Donation'
        };
      }

      console.log('Sending basket data:', transformedData);
      
      const response = await basketApi.addToBasket(transformedData);
      
      // Refresh basket after adding
      await get().fetchBasket();
      
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error in addToBasket:', error);
      throw error;
    }
  },

  // Remove item from basket
  removeFromBasket: async (basketItemId) => {
    set({ loading: true, error: null });
    try {
      await basketApi.removeFromBasket(basketItemId);
      
      // Refresh basket after removing
      await get().fetchBasket();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update basket item quantity
  updateBasketItem: async (basketItemId, updateData) => {
    set({ loading: true, error: null });
    try {
      await basketApi.updateBasketItem(basketItemId, updateData);
      
      // Refresh basket after updating
      await get().fetchBasket();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear entire basket
  clearBasket: async () => {
    set({ loading: true, error: null });
    try {
      await basketApi.clearBasket();
      set({ basketItems: [], basketSummary: null, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Get total amount
  getTotalAmount: () => {
    const { basketItems, basketSummary } = get();
    
    // If we have summary from API, use it
    if (basketSummary && basketSummary.total) {
      return basketSummary.total;
    }
    
    // Otherwise calculate from items
    if (!Array.isArray(basketItems)) {
      return 0;
    }
    
    return basketItems.reduce((total, item) => {
      const amount = parseFloat(item.amount) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return total + (amount * quantity);
    }, 0);
  },

  // Get basket item count
  getBasketItemCount: () => {
    const { basketItems } = get();
    // Ensure basketItems is an array before calling reduce
    if (!Array.isArray(basketItems)) {
      console.warn('basketItems is not an array:', basketItems);
      return 0;
    }
    return basketItems.reduce((count, item) => count + (item.quantity || 1), 0);
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useBasketStore;