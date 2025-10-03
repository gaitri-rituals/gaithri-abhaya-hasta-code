import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Check, AlertCircle, ShieldCheck, Package, Gift } from 'lucide-react';
import { addBooking, generateTicketQR } from '../utils/localStorage';
import { toast } from 'sonner';
import InnerPageWrapper from '../components/InnerPageWrapper';
import useCartStore from '../store/cartStore';
import useBasketStore from '../store/basketStore';

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [generatedBookings, setGeneratedBookings] = useState([]);
  const { cartItems, getCartTotal, clearCart } = useCartStore();
  const { basketItems = [], fetchBasket, clearBasket } = useBasketStore();

  useEffect(() => {
    fetchBasket();
  }, [fetchBasket]);

  useEffect(() => {
    if ((basketItems?.length || 0) === 0 && cartItems.length === 0) {
      navigate('/basket');
    }
  }, [navigate, basketItems?.length, cartItems.length]);

  const calculateTotal = () => {
    const templeTotal = (basketItems || []).reduce((total, item) => {
      if (item.serviceType === 'donation') {
        return total + item.amount;
      } else {
        return total + (item.totalAmount || item.amount * item.quantity);
      }
    }, 0);
    const storeTotal = getCartTotal();
    return templeTotal + storeTotal;
  };

  const handleRazorpayPayment = () => {
    setLoading(true);

    // Check if Razorpay is loaded
    if (typeof window.Razorpay === 'undefined') {
      console.error('Razorpay SDK not loaded');
      toast.error('Payment system not available. Please try again.');
      setLoading(false);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag', // Use environment variable or fallback
      amount: calculateTotal() * 100, // Amount in paise
      currency: 'INR',
      name: 'Divine Temple',
      description: 'Temple Services Payment',
      image: '/logo.png',
      handler: function (response) {
        handlePaymentSuccess(response);
      },
      prefill: {
        name: 'Devotee Name',
        email: 'devotee@example.com',
        contact: '9999999999'
      },
      notes: {
        address: 'Temple Services'
      },
      theme: {
        color: '#FF6B35'
      },
      modal: {
        ondismiss: function() {
          setLoading(false);
          toast.error('Payment cancelled');
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setLoading(false);
        console.error('Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (error) {
      setLoading(false);
      console.error('Error opening Razorpay:', error);
      toast.error('Failed to open payment gateway. Please try again.');
    }
  };

  const handlePaymentSuccess = (paymentResponse) => {
    setLoading(false);
    
    // Create bookings for each item
    const bookings = (basketItems || []).map((item) => {
      const booking = {
        templeId: item.templeId,
        templeName: item.templeName,
        serviceType: item.serviceType,
        serviceName: item.serviceName,
        amount: item.serviceType === 'donation' ? item.amount : (item.totalAmount || item.amount * item.quantity),
        quantity: item.quantity || 1,
        devotees: item.devotees || [],
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
        qrCode: '', // Will be set after adding booking
        visitDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default to tomorrow
      };
      
      const savedBooking = addBooking(booking);
      if (savedBooking) {
        savedBooking.qrCode = generateTicketQR(savedBooking);
      }
      return savedBooking;
    });

    setGeneratedBookings(bookings);
    clearBasket();
    clearCart();
    setPaymentSuccess(true);
    toast.success('Payment successful! Digital tickets generated.');
  };

  const handleBackClick = () => {
    if (paymentSuccess) {
      navigate('/my-bookings');
    } else {
      navigate('/basket');
    }
  };

  if (paymentSuccess) {
    return (
      <InnerPageWrapper
        title="Payment Successful"
        onBackClick={handleBackClick}
        showBackButton={false}
      >
        <div className="p-4 pb-20">
          <div className="text-center py-8">
            <div className="bg-green-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Check size={48} className="text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Your temple services have been booked successfully
            </p>

            <div className="bg-card rounded-2xl p-4 border border-border mb-6">
              <h3 className="font-semibold text-foreground mb-4">Digital Tickets Generated</h3>
              <div className="space-y-3">
                {generatedBookings.map((booking, index) => (
                  <div key={booking.id} className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-3 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-medium text-foreground">{booking.serviceName}</p>
                        <p className="text-sm text-muted-foreground">{booking.templeName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">₹{booking.amount}</p>
                        <p className="text-xs text-muted-foreground">Ticket #{booking.id.toString().slice(-6)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <motion.button
                onClick={() => navigate('/my-bookings')}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                View My Bookings
              </motion.button>
              
              <motion.button
                onClick={() => navigate('/explore-temples')}
                className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue Exploring
              </motion.button>
            </div>
          </div>
        </div>
      </InnerPageWrapper>
    );
  }

  return (
    <InnerPageWrapper
      title="Checkout"
      onBackClick={handleBackClick}
    >
      <div className="p-4 pb-20">
        {/* Order Summary */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-6">
          <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>
          <div className="space-y-3">
            {(basketItems || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.serviceName}</p>
                  <p className="text-sm text-muted-foreground">{item.templeName}</p>
                  {item.devotees && item.devotees.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {item.devotees.length} devotee{item.devotees.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">
                    ₹{item.serviceType === 'donation' ? item.amount : (item.totalAmount || item.amount * item.quantity)}
                  </p>
                  {item.serviceType !== 'donation' && item.quantity > 1 && (
                    <p className="text-xs text-muted-foreground">
                      ₹{item.amount} x {item.quantity}
                    </p>
                  )}
                </div>
              </div>
            ))}
          {cartItems.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2"><Package size={16} /> Store Products</h4>
              {cartItems.map((item) => (
                <div key={`store-${item.id}`} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">₹{item.price * item.quantity}</p>
                    <p className="text-xs text-muted-foreground">₹{item.price} x {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
          
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
            <span className="text-lg font-semibold text-foreground">Total Amount:</span>
            <span className="text-2xl font-bold text-primary">₹{calculateTotal()}</span>
          </div>
        </div>

        {/* Payment Security Info */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 border border-green-200 mb-6">
          <div className="flex items-center mb-3">
            <ShieldCheck size={20} className="text-green-600 mr-2" />
            <h3 className="font-semibold text-green-800">Secure Payment</h3>
          </div>
          <p className="text-green-700 text-sm">
            Your payment is processed securely through Razorpay. We never store your card details.
          </p>
        </div>

        {/* Payment Button */}
        <div className="space-y-4">
          <motion.button
            onClick={handleRazorpayPayment}
            disabled={loading || ((basketItems?.length || 0) === 0 && cartItems.length === 0)}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center">
                <CreditCard size={20} className="mr-2" />
                Pay ₹{calculateTotal()} with Razorpay
              </div>
            )}
          </motion.button>

          {/* Test Payment Info */}
          <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
            <div className="flex items-start">
              <AlertCircle size={16} className="text-yellow-600 mr-2 mt-0.5" />
              <div>
                <p className="text-yellow-800 text-sm font-medium mb-1">Test Mode</p>
                <p className="text-yellow-700 text-xs">
                  This is a demo. In production, this would integrate with Razorpay payment gateway.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By proceeding with payment, you agree to our{' '}
            <button className="text-primary hover:underline">Terms of Service</button>
            {' '}and{' '}
            <button className="text-primary hover:underline">Privacy Policy</button>
          </p>
        </div>
      </div>
    </InnerPageWrapper>
  );
};

export default Checkout;