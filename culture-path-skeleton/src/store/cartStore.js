import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      
      addToCart: (product) => {
        set((state) => {
          const existingItem = state.cartItems.find(item => item.id === product.id);
          
          if (existingItem) {
            // If product exists, increase quantity
            return {
              cartItems: state.cartItems.map(item =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            };
          } else {
            // Add new product with quantity 1
            return {
              cartItems: [...state.cartItems, { ...product, quantity: 1 }]
            };
          }
        });
        toast.success('Added to cart');
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        
        set((state) => ({
          cartItems: state.cartItems.map(item =>
            item.id === productId
              ? { ...item, quantity }
              : item
          )
        }));
      },
      
      removeFromCart: (productId) => {
        set((state) => ({
          cartItems: state.cartItems.filter(item => item.id !== productId)
        }));
        toast.success('Removed from cart');
      },
      
      clearCart: () => {
        set({ cartItems: [] });
      },
      
      getCartTotal: () => {
        const { cartItems } = get();
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      getCartItemCount: () => {
        const { cartItems } = get();
        return cartItems.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'divine-store-cart'
    }
  )
);

export default useCartStore;