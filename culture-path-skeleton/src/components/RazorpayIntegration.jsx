import { useState } from 'react';
import { toast } from 'sonner';

const RazorpayIntegration = ({ orderData, onSuccess, onFailure }) => {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      const scriptLoaded = await loadRazorpayScript();
      
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        setLoading(false);
        return;
      }

      const options = {
        key: 'rzp_test_RMViRJx3a6zOlz', // Test key from uploaded file
        amount: orderData.amount * 100, // Amount in paise
        currency: 'INR',
        name: 'NamOota Temple Classes',
        description: orderData.description || 'Temple Class Subscription',
        order_id: `order_${Date.now()}`, // Generate order ID
        handler: function (response) {
          // Payment successful
          const paymentData = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            ...orderData
          };
          
          toast.success('Payment successful!');
          onSuccess(paymentData);
        },
        prefill: {
          name: orderData.customerName || 'Student',
          email: orderData.customerEmail || 'student@example.com',
          contact: orderData.customerPhone || '9999999999'
        },
        notes: {
          subscription_type: orderData.subscriptionType,
          class_id: orderData.classId,
          duration: orderData.duration
        },
        theme: {
          color: '#F59E0B' // Using amber color to match temple theme
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        toast.error('Payment failed: ' + response.error.description);
        onFailure(response.error);
        setLoading(false);
      });

      razorpay.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment initialization failed');
      setLoading(false);
    }
  };

  return {
    handlePayment,
    loading
  };
};

export default RazorpayIntegration;