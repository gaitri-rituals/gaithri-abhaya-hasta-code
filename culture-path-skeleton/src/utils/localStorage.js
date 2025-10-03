// LocalStorage utilities for temple app data
import useBasketStore from '../store/basketStore.js';

export const StorageKeys = {
  FAVORITES: 'temple-favorites',
  BASKET: 'temple-basket', 
  BOOKINGS: 'temple-bookings',
  USER_PREFERENCES: 'user-preferences',
  PUJA_BOOKINGS: 'puja-bookings',
  PUJA_DRAFT: 'puja-booking-draft',
  CLASS_SUBSCRIPTIONS: 'class-subscriptions',
  LEARNING_PROGRESS: 'learning-progress',
  GAMIFICATION_DATA: 'gamification-data',
  DAILY_STREAKS: 'daily-streaks',
  ENROLLMENT_DRAFT: 'enrollment-draft'
};

// Favorites management
export const getFavorites = () => {
  try {
    const favorites = localStorage.getItem(StorageKeys.FAVORITES);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const addToFavorites = (templeId) => {
  try {
    const favorites = getFavorites();
    if (!favorites.includes(templeId)) {
      favorites.push(templeId);
      localStorage.setItem(StorageKeys.FAVORITES, JSON.stringify(favorites));
    }
    return favorites;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return getFavorites();
  }
};

export const removeFromFavorites = (templeId) => {
  try {
    const favorites = getFavorites();
    const updated = favorites.filter(id => id !== templeId);
    localStorage.setItem(StorageKeys.FAVORITES, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return getFavorites();
  }
};

// Basket management - Now using API-based store
// Note: These functions are kept for backward compatibility but now use the API

export const getBasket = async () => {
  try {
    const basketStore = useBasketStore.getState();
    await basketStore.fetchBasket();
    return basketStore.basketItems;
  } catch (error) {
    console.error('Error getting basket:', error);
    return [];
  }
};

export const addToBasket = async (item) => {
  try {
    const basketStore = useBasketStore.getState();
    await basketStore.addToBasket(item);
    return basketStore.basketItems;
  } catch (error) {
    console.error('Error adding to basket:', error);
    // Fallback to current basket items
    return useBasketStore.getState().basketItems;
  }
};

export const removeFromBasket = async (itemId) => {
  try {
    const basketStore = useBasketStore.getState();
    await basketStore.removeFromBasket(itemId);
    return basketStore.basketItems;
  } catch (error) {
    console.error('Error removing from basket:', error);
    return useBasketStore.getState().basketItems;
  }
};

export const updateBasketItem = async (itemId, updates) => {
  try {
    const basketStore = useBasketStore.getState();
    await basketStore.updateBasketItem(itemId, updates);
    return basketStore.basketItems;
  } catch (error) {
    console.error('Error updating basket item:', error);
    return useBasketStore.getState().basketItems;
  }
};

export const clearBasket = async () => {
  try {
    const basketStore = useBasketStore.getState();
    await basketStore.clearBasket();
    return [];
  } catch (error) {
    console.error('Error clearing basket:', error);
    return [];
  }
};

// Bookings management
export const getBookings = () => {
  try {
    const bookings = localStorage.getItem(StorageKeys.BOOKINGS);
    return bookings ? JSON.parse(bookings) : [];
  } catch (error) {
    console.error('Error getting bookings:', error);
    return [];
  }
};

export const addBooking = (booking) => {
  try {
    const bookings = getBookings();
    const bookingWithId = {
      ...booking,
      id: Date.now() + Math.random(),
      bookedAt: new Date().toISOString(),
      status: 'confirmed',
      type: 'temple' // Temple seva bookings
    };
    bookings.push(bookingWithId);
    localStorage.setItem(StorageKeys.BOOKINGS, JSON.stringify(bookings));
    return bookingWithId;
  } catch (error) {
    console.error('Error adding booking:', error);
    return null;
  }
};

// Generate simple QR data for tickets
export const generateTicketQR = (booking) => {
  return `TEMPLE-TICKET-${booking.id}-${booking.templeId}-${booking.serviceType}`;
};

// Puja booking management
export const getPujaBookings = () => {
  try {
    const bookings = localStorage.getItem(StorageKeys.PUJA_BOOKINGS);
    return bookings ? JSON.parse(bookings) : [];
  } catch (error) {
    console.error('Error getting puja bookings:', error);
    return [];
  }
};

export const addPujaBooking = (booking) => {
  try {
    const bookings = getPujaBookings();
    const bookingWithId = {
      ...booking,
      id: Date.now() + Math.random(),
      bookedAt: new Date().toISOString(),
      status: 'confirmed',
      type: 'puja'
    };
    bookings.push(bookingWithId);
    localStorage.setItem(StorageKeys.PUJA_BOOKINGS, JSON.stringify(bookings));
    return bookingWithId;
  } catch (error) {
    console.error('Error adding puja booking:', error);
    return null;
  }
};

// Puja booking draft management (for stepper flow)
export const savePujaBookingDraft = (draftData) => {
  try {
    localStorage.setItem(StorageKeys.PUJA_DRAFT, JSON.stringify(draftData));
  } catch (error) {
    console.error('Error saving puja booking draft:', error);
  }
};

export const getPujaBookingDraft = () => {
  try {
    const draft = localStorage.getItem(StorageKeys.PUJA_DRAFT);
    return draft ? JSON.parse(draft) : null;
  } catch (error) {
    console.error('Error getting puja booking draft:', error);
    return null;
  }
};

export const clearPujaBookingDraft = () => {
  try {
    localStorage.removeItem(StorageKeys.PUJA_DRAFT);
  } catch (error) {
    console.error('Error clearing puja booking draft:', error);
  }
};

// Class Subscriptions Management
export const getClassSubscriptions = () => {
  try {
    const subscriptions = localStorage.getItem(StorageKeys.CLASS_SUBSCRIPTIONS);
    return subscriptions ? JSON.parse(subscriptions) : [];
  } catch (error) {
    console.error('Error getting class subscriptions:', error);
    return [];
  }
};

export const addClassSubscription = (subscription) => {
  try {
    const subscriptions = getClassSubscriptions();
    const subscriptionWithId = {
      ...subscription,
      id: Date.now() + Math.random(),
      subscribedAt: new Date().toISOString(),
      status: 'active',
      type: 'class_subscription'
    };
    subscriptions.push(subscriptionWithId);
    localStorage.setItem(StorageKeys.CLASS_SUBSCRIPTIONS, JSON.stringify(subscriptions));
    return subscriptionWithId;
  } catch (error) {
    console.error('Error adding class subscription:', error);
    return null;
  }
};

// Learning Progress Management
export const getLearningProgress = (subscriptionId) => {
  try {
    const progress = localStorage.getItem(StorageKeys.LEARNING_PROGRESS);
    const allProgress = progress ? JSON.parse(progress) : {};
    return allProgress[subscriptionId] || { completedModules: [], currentStreak: 0, totalPoints: 0 };
  } catch (error) {
    console.error('Error getting learning progress:', error);
    return { completedModules: [], currentStreak: 0, totalPoints: 0 };
  }
};

export const updateLearningProgress = (subscriptionId, moduleId, points = 10) => {
  try {
    const progress = localStorage.getItem(StorageKeys.LEARNING_PROGRESS);
    const allProgress = progress ? JSON.parse(progress) : {};
    
    if (!allProgress[subscriptionId]) {
      allProgress[subscriptionId] = { completedModules: [], currentStreak: 0, totalPoints: 0 };
    }
    
    if (!allProgress[subscriptionId].completedModules.includes(moduleId)) {
      allProgress[subscriptionId].completedModules.push(moduleId);
      allProgress[subscriptionId].totalPoints += points;
      
      // Update streak
      const today = new Date().toDateString();
      const streakData = getDailyStreaks(subscriptionId);
      if (!streakData.lastCompletedDate || streakData.lastCompletedDate !== today) {
        allProgress[subscriptionId].currentStreak = streakData.currentStreak + 1;
        updateDailyStreak(subscriptionId);
      }
    }
    
    localStorage.setItem(StorageKeys.LEARNING_PROGRESS, JSON.stringify(allProgress));
    return allProgress[subscriptionId];
  } catch (error) {
    console.error('Error updating learning progress:', error);
    return getLearningProgress(subscriptionId);
  }
};

// Daily Streaks Management
export const getDailyStreaks = (subscriptionId) => {
  try {
    const streaks = localStorage.getItem(StorageKeys.DAILY_STREAKS);
    const allStreaks = streaks ? JSON.parse(streaks) : {};
    return allStreaks[subscriptionId] || { currentStreak: 0, longestStreak: 0, lastCompletedDate: null };
  } catch (error) {
    console.error('Error getting daily streaks:', error);
    return { currentStreak: 0, longestStreak: 0, lastCompletedDate: null };
  }
};

export const updateDailyStreak = (subscriptionId) => {
  try {
    const streaks = localStorage.getItem(StorageKeys.DAILY_STREAKS);
    const allStreaks = streaks ? JSON.parse(streaks) : {};
    const today = new Date().toDateString();
    
    if (!allStreaks[subscriptionId]) {
      allStreaks[subscriptionId] = { currentStreak: 0, longestStreak: 0, lastCompletedDate: null };
    }
    
    const streak = allStreaks[subscriptionId];
    
    if (streak.lastCompletedDate === today) {
      return streak; // Already completed today
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (streak.lastCompletedDate === yesterdayStr) {
      // Continue streak
      streak.currentStreak += 1;
    } else {
      // Start new streak
      streak.currentStreak = 1;
    }
    
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    streak.lastCompletedDate = today;
    
    localStorage.setItem(StorageKeys.DAILY_STREAKS, JSON.stringify(allStreaks));
    return streak;
  } catch (error) {
    console.error('Error updating daily streak:', error);
    return getDailyStreaks(subscriptionId);
  }
};

// Enrollment Draft Management
export const saveEnrollmentDraft = (draftData) => {
  try {
    localStorage.setItem(StorageKeys.ENROLLMENT_DRAFT, JSON.stringify(draftData));
  } catch (error) {
    console.error('Error saving enrollment draft:', error);
  }
};

export const getEnrollmentDraft = () => {
  try {
    const draft = localStorage.getItem(StorageKeys.ENROLLMENT_DRAFT);
    return draft ? JSON.parse(draft) : null;
  } catch (error) {
    console.error('Error getting enrollment draft:', error);
    return null;
  }
};

export const clearEnrollmentDraft = () => {
  try {
    localStorage.removeItem(StorageKeys.ENROLLMENT_DRAFT);
  } catch (error) {
    console.error('Error clearing enrollment draft:', error);
  }
};