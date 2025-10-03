import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/authApi';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Onboarding state
      isOnboardingCompleted: false,
      completeOnboarding: () => set({ isOnboardingCompleted: true }),

      // Authentication state
      isAuthenticated: false,
      user: null,
      authToken: null,
      isLoading: false,
      authError: null,
      
      // Language state
      currentLanguage: 'en',
      setLanguage: (language) => set({ currentLanguage: language }),

      // Address state
      currentAddress: null,
      savedAddresses: [],
      
      // Theme state
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // Authentication Actions
      login: async (phone) => {
        set({ isLoading: true, authError: null });
        try {
          const response = await authApi.login(phone);
          return response;
        } catch (error) {
          set({ authError: error.message || 'Login failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOTP: async (phone, otp) => {
        set({ isLoading: true, authError: null });
        try {
          const response = await authApi.verifyOTP(phone, otp);
          if (response.success) {
            set({
              isAuthenticated: true,
              user: response.user,
              authToken: response.token,
            });
          }
          return response;
        } catch (error) {
          set({ authError: error.message || 'OTP verification failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (userData) => {
        set({ isLoading: true, authError: null });
        try {
          const response = await authApi.register(userData);
          if (response.success) {
            set({
              isAuthenticated: true,
              user: response.user,
              authToken: response.token,
            });
          }
          return response;
        } catch (error) {
          set({ authError: error.message || 'Registration failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch (error) {
          console.warn('Logout API call failed:', error);
        } finally {
          set({
            isAuthenticated: false,
            user: null,
            authToken: null,
            isLoading: false,
            authError: null,
          });
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true, authError: null });
        try {
          const updatedUser = await authApi.updateProfile(userData);
          set({ user: updatedUser });
          return updatedUser;
        } catch (error) {
          set({ authError: error.message || 'Profile update failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      refreshUserProfile: async () => {
        try {
          const user = await authApi.getProfile();
          if (user) {
            set({ user });
          }
          return user;
        } catch (error) {
          console.warn('Failed to refresh user profile:', error);
          return null;
        }
      },

      clearAuthError: () => set({ authError: null }),
      
      setCurrentAddress: (address) => set({ currentAddress: address }),
      
      addSavedAddress: (address) => set((state) => ({
        savedAddresses: [...state.savedAddresses, { ...address, id: Date.now() }]
      })),
      
      updateSavedAddress: (addressId, updatedAddress) => set((state) => ({
        savedAddresses: state.savedAddresses.map(addr => 
          addr.id === addressId ? { ...updatedAddress, id: addressId } : addr
        )
      })),
      
      removeSavedAddress: (addressId) => set((state) => ({
        savedAddresses: state.savedAddresses.filter(addr => addr.id !== addressId)
      })),

      // Initialize app
      initializeApp: async () => {
        // Check if user is authenticated via API
        if (authApi.isAuthenticated()) {
          const user = authApi.getCurrentUser();
          if (user) {
            set({
              isAuthenticated: true,
              user,
              authToken: authApi.getAuthToken(),
            });
            
            // Refresh user profile from API
            try {
              const freshUser = await authApi.getProfile();
              if (freshUser) {
                set({ user: freshUser });
              }
            } catch (error) {
              console.warn('Failed to refresh user profile on init:', error);
            }
          }
        }
      }
    }),
    {
      name: 'divine-temple-app',
      partialize: (state) => ({
        isOnboardingCompleted: state.isOnboardingCompleted,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        authToken: state.authToken,
        currentLanguage: state.currentLanguage,
        currentAddress: state.currentAddress,
        savedAddresses: state.savedAddresses,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);