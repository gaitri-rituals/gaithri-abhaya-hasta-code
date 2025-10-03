import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Edit3, Plus, Minus, Calendar, Clock, User, Gift, Package } from 'lucide-react';
import { addClassSubscription } from '../utils/localStorage';
// RazorpayIntegration removed - payment handled in checkout page
import { toast } from 'sonner';
import InnerPageWrapper from '../components/InnerPageWrapper';
import useCartStore from '../store/cartStore';
import useBasketStore from '../store/basketStore';

const Basket = () => {
  const navigate = useNavigate();
  // Loading state removed - handled in checkout page
  
  const { cartItems = [], updateQuantity, removeFromCart, clearCart, getCartTotal } = useCartStore();
  const { basketItems: templeItems = [], fetchBasket, removeFromBasket, updateBasketItem, clearBasket } = useBasketStore();
  const storeTotal = getCartTotal();

  useEffect(() => {
    fetchBasket();
  }, [fetchBasket]);

  const handleRemoveTempleItem = async (itemId) => {
    await removeFromBasket(itemId);
    toast.success('Item removed from basket');
  };

  const handleUpdateTempleQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveTempleItem(itemId);
      return;
    }

    const item = Array.isArray(templeItems) ? templeItems.find(item => item.id === itemId) : null;
    if (!item) return;
    
    const updatedItem = {
      quantity: newQuantity,
      totalAmount: item.serviceType === 'donation' ? item.amount : item.amount * newQuantity
    };

    await updateBasketItem(itemId, updatedItem);
  };

  const calculateTempleTotal = () => {
    if (!Array.isArray(templeItems)) {
      return 0;
    }
    return templeItems.reduce((total, item) => {
      if (item.type === 'class_subscription') {
        return total + item.price;
      } else if (item.serviceType === 'donation') {
        return total + item.amount;
      } else {
        return total + (item.totalAmount || item.amount * item.quantity);
      }
    }, 0);
  };
  
  const calculateGrandTotal = () => {
    return calculateTempleTotal() + storeTotal;
  };

  // Payment handling moved to checkout page

  // Remove Razorpay integration from basket - payment will be handled in checkout page

  const handleProceedToCheckout = () => {
    const totalItems = (Array.isArray(templeItems) ? templeItems.length : 0) + (Array.isArray(cartItems) ? cartItems.length : 0);
    
    if (totalItems === 0) {
      toast.error('Your basket is empty');
      return;
    }
    // Navigate to checkout with all items
    navigate('/checkout');
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const rightContent = ((Array.isArray(templeItems) ? templeItems.length : 0) > 0 || (Array.isArray(cartItems) ? cartItems.length : 0) > 0) && (
    <motion.button
      onClick={async () => {
        await clearBasket();
        clearCart();
        toast.success('Basket cleared');
      }}
      className="p-2 hover:bg-muted rounded-full transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Trash2 size={20} className="text-destructive" />
    </motion.button>
  );

  return (
    <InnerPageWrapper
      title="My Basket"
      onBackClick={handleBackClick}
      rightContent={rightContent}
    >
      <div className="p-4 pb-32">
        {(Array.isArray(templeItems) ? templeItems.length : 0) === 0 && (Array.isArray(cartItems) ? cartItems.length : 0) === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-muted rounded-full p-6 mb-4">
              <ShoppingBag size={48} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Your basket is empty</h3>
            <p className="text-muted-foreground text-center mb-6">
              Add some temple services to your basket to continue
            </p>
            <motion.button
              onClick={() => navigate('/explore-temples')}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Explore Temples
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Store Products */}
            {cartItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Package size={18} />
                  Store Products
                </h3>
                {cartItems.map((item) => (
                  <motion.div
                    key={`store-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl p-4 border border-border shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <p className="text-muted-foreground text-sm">{item.category}</p>
                        <p className="text-primary font-medium text-sm mt-1">
                          ₹{item.price} x {item.quantity}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Quantity:</span>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-muted rounded-full transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-medium text-lg min-w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-muted rounded-full transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="font-semibold text-foreground">Total:</span>
                      <span className="font-bold text-lg text-primary">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Temple Services */}
            {Array.isArray(templeItems) && templeItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Gift size={18} />
                  Temple Services
                </h3>
              {templeItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl p-4 border border-border shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.serviceName}</h3>
                      <p className="text-muted-foreground text-sm">{item.templeName}</p>
                      <p className="text-primary font-medium text-sm mt-1">
                        ₹{item.amount} {item.serviceType !== 'donation' && `x ${item.quantity}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUpdateTempleQuantity(item.id, item.quantity - 1)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Devotee Details */}
                  {item.devotees && item.devotees.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-foreground mb-2">Devotees:</h4>
                      <div className="space-y-1">
                        {item.devotees.map((devotee, index) => (
                          <div key={devotee.id} className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            {index + 1}. {devotee.name}
                            {devotee.dob && ` (DOB: ${devotee.dob})`}
                            {devotee.nakshatra && ` - ${devotee.nakshatra}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity Controls for non-donation items */}
                  {item.serviceType !== 'donation' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Quantity:</span>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleUpdateTempleQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-muted rounded-full transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-medium text-lg min-w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateTempleQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-muted rounded-full transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="font-semibold text-foreground">Total:</span>
                    <span className="font-bold text-lg text-primary">
                      ₹{item.serviceType === 'donation' ? item.amount : (item.totalAmount || item.amount * item.quantity)}
                    </span>
                  </div>
                </motion.div>
            ))}
            </div>
          )}

          {/* Summary */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-4 border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-foreground">
                  Total Items: {(Array.isArray(templeItems) ? templeItems.length : 0) + (Array.isArray(cartItems) ? cartItems.length : 0)}
                </span>
                <span className="text-2xl font-bold text-primary">
                  ₹{calculateGrandTotal()}
                </span>
              </div>
              
              <motion.button
                onClick={handleProceedToCheckout}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Proceed to Checkout
              </motion.button>
            </div>

            {/* Continue Shopping */}
            <div className="text-center">
              <button
                onClick={() => navigate('/explore-temples')}
                className="text-primary font-medium hover:underline"
              >
                Continue Exploring Temples
              </button>
            </div>
          </div>
        )}
      </div>
    </InnerPageWrapper>
  );
};

export default Basket;