import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Users, ShoppingBag, Info, SkipForward } from 'lucide-react';
import { savePujaBookingDraft, getPujaBookingDraft, clearPujaBookingDraft } from '../utils/localStorage';
import useBasketStore from '../store/basketStore';
import { pujaPackages, cateringOptions, addOnServices } from '../data/pujaCategories';
import { toast } from 'sonner';
import InnerPageWrapper from '../components/InnerPageWrapper';
import PackageDetailsModal from '../components/PackageDetailsModal';
import DateTimePicker from '../components/DateTimePicker';
import { useAppStore } from '../state/store';
import { bookingAPI, paymentAPI } from '../services/api';

const PujaBookingDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPuja, category } = location.state || {};
  const { currentAddress } = useAppStore();
  const { addToBasket } = useBasketStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackageForModal, setSelectedPackageForModal] = useState(null);
  const [bookingData, setBookingData] = useState({
    puja: selectedPuja,
    category: category,
    dateTime: '',
    address: currentAddress?.fullName || '',
    package: 'basic',
    catering: 'basic',
    guestCount: 10,
    addOns: [],
    specialRequests: '',
    skipCatering: false
  });

  const totalSteps = 4; // Changed from 5 to 4

  useEffect(() => {
    // Load draft if exists
    const draft = getPujaBookingDraft();
    if (draft && draft.puja?.id === selectedPuja?.id) {
      setBookingData(draft);
    }
  }, [selectedPuja]);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Save draft on data change
    if (selectedPuja) {
      savePujaBookingDraft(bookingData);
    }
  }, [bookingData, selectedPuja]);

  const updateBookingData = (updates) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateTotal = () => {
    const pujaPrice = selectedPuja?.basePrice || 0;
    const packageMultiplier = pujaPackages[bookingData.package]?.priceMultiplier || 1;
    const pujaTotal = pujaPrice * packageMultiplier;
    
    const cateringTotal = !bookingData.skipCatering ? 
      (cateringOptions[bookingData.catering]?.pricePerPerson || 0) * bookingData.guestCount : 0;
    
    const addOnsTotal = bookingData.addOns.reduce((total, addonId) => {
      const addon = addOnServices.find(a => a.id === addonId);
      return total + (addon?.price || 0);
    }, 0);

    return pujaTotal + cateringTotal + addOnsTotal;
  };

  const handleAddToBasket = async () => {
    const basketItem = {
      puja: bookingData.puja,
      category: bookingData.category,
      dateTime: bookingData.dateTime,
      address: bookingData.address,
      package: bookingData.package,
      catering: bookingData.skipCatering ? null : bookingData.catering,
      guestCount: bookingData.guestCount,
      addOns: bookingData.addOns,
      specialRequests: bookingData.specialRequests,
      totalAmount: calculateTotal(),
      serviceType: 'puja',
      serviceName: `${bookingData.puja?.name} (${pujaPackages[bookingData.package]?.name})`,
      templeName: 'Home Service',
      quantity: 1
    };

    await addToBasket(basketItem);
    clearPujaBookingDraft();
    toast.success('Added to basket successfully!');
    navigate('/basket');
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create booking first
      const bookingResponse = await bookingAPI.puja.createPujaBooking({
        pujaId: selectedPuja.id,
        dateTime: bookingData.dateTime,
        package: bookingData.package,
        catering: !bookingData.skipCatering ? bookingData.catering : null,
        guestCount: bookingData.guestCount,
        addOns: bookingData.addOns,
        specialRequests: bookingData.specialRequests,
        amount: calculateTotal()
      });

      // Create Razorpay order
      const orderResponse = await paymentAPI.createOrder({
        amount: calculateTotal(),
        bookingId: bookingResponse.id,
        currency: 'INR'
      });

      // Initialize Razorpay payment
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: 'Abhaya Hasta',
        description: `Booking for ${selectedPuja.name}`,
        order_id: orderResponse.id,
        handler: async (response) => {
          try {
            // Verify payment
            await paymentAPI.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingResponse.id
            });

            // Clear draft and navigate to success page
            clearPujaBookingDraft();
            navigate('/booking-success', { 
              state: { 
                bookingId: bookingResponse.id,
                type: 'puja'
              }
            });
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: currentAddress?.fullName || '',
          contact: currentAddress?.phone || '',
        },
        theme: {
          color: '#FF6B35'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err.message || 'Failed to process payment');
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    if (currentStep > 1) {
      prevStep();
    } else {
      navigate('/puja-booking');
    }
  };

  // Validation functions for each step
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return bookingData.dateTime && bookingData.address;
      case 2:
        return bookingData.package;
      case 3:
        return bookingData.skipCatering || (bookingData.catering && bookingData.guestCount > 0);
      case 4:
        return true; // Add-ons are optional
      default:
        return false;
    }
  };

  const isNextDisabled = () => {
    return !validateStep(currentStep);
  };

  const handleAddressChange = () => {
    navigate('/address', { 
      state: { 
        returnTo: '/puja-booking-details',
        returnData: { selectedPuja, currentStep, bookingData }
      }
    });
  };

  if (!selectedPuja) {
    navigate('/puja-booking');
    return null;
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <DateTimeLocationStep 
          bookingData={bookingData} 
          updateData={updateBookingData} 
          onAddressChange={handleAddressChange}
        />;
      case 2:
        return <PackageSelectionStep 
          bookingData={bookingData} 
          updateData={updateBookingData} 
          puja={selectedPuja}
          onShowPackageDetails={(packageKey) => {
            setSelectedPackageForModal(packageKey);
            setShowPackageModal(true);
          }}
        />;
      case 3:
        return <CateringStep 
          bookingData={bookingData} 
          updateData={updateBookingData} 
        />;
      case 4:
        return <AddOnsStep 
          bookingData={bookingData} 
          updateData={updateBookingData} 
          onAddToBasket={handleAddToBasket}
          total={calculateTotal()}
        />;
      default:
        return null;
    }
  };

  return (
    <InnerPageWrapper
      title={`Book ${selectedPuja.name}`}
      onBackClick={handleBackClick}
    >
      <div className="p-4 pb-32">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-96">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {currentStep > 1 && (
              <motion.button
                onClick={prevStep}
                className="flex items-center px-6 py-3 text-muted-foreground"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronLeft size={20} className="mr-1" />
                Back
              </motion.button>
            )}
            
            <div className="flex-1" />
            
            {currentStep < totalSteps ? (
              <motion.button
                onClick={nextStep}
                disabled={isNextDisabled()}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isNextDisabled() ? 1 : 1.02 }}
                whileTap={{ scale: isNextDisabled() ? 1 : 0.98 }}
              >
                Next
                <ChevronRight size={20} className="ml-1" />
              </motion.button>
            ): (
              <motion.button
                onClick={handleAddToBasket}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isNextDisabled() ? 1 : 1.02 }}
                whileTap={{ scale: isNextDisabled() ? 1 : 0.98 }}
              >
                Go to basket
                <ChevronRight size={20} className="ml-1" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Package Details Modal */}
      <PackageDetailsModal
        isOpen={showPackageModal}
        onClose={() => setShowPackageModal(false)}
        packageData={selectedPackageForModal ? pujaPackages[selectedPackageForModal] : null}
        basePrice={selectedPuja?.basePrice || 0}
        onSelectPackage={() => {
          if (selectedPackageForModal) {
            updateBookingData({ package: selectedPackageForModal });
          }
        }}
      />
    </InnerPageWrapper>
  );
};

// Step Components
const DateTimeLocationStep = ({ bookingData, updateData, onAddressChange }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-foreground">Date, Time & Address</h2>
    
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <Calendar size={16} className="inline mr-2" />
          Date & Time *
        </label>
        <DateTimePicker
          value={bookingData.dateTime}
          onChange={(dateTime) => updateData({ dateTime })}
          minDate={new Date().toISOString().slice(0, 16)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <MapPin size={16} className="inline mr-2" />
          Service Address *
        </label>
        <div className="space-y-3">
          {bookingData.address ? (
            <div className="p-3 border border-border rounded-lg bg-muted/30">
              <p className="text-sm text-foreground">{bookingData.address}</p>
              <button
                onClick={onAddressChange}
                className="text-primary text-sm hover:underline mt-1"
              >
                Change address
              </button>
            </div>
          ) : (
            <button
              onClick={onAddressChange}
              className="w-full p-3 border-2 border-dashed border-border rounded-lg text-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              + Select service address
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Validation Messages */}
    <div className="text-sm text-muted-foreground">
      <p>* Required fields</p>
      {!bookingData.dateTime && (
        <p className="text-destructive">Please select date and time</p>
      )}
      {!bookingData.address && (
        <p className="text-destructive">Please select service address</p>
      )}
    </div>
  </div>
);

const PackageSelectionStep = ({ bookingData, updateData, puja, onShowPackageDetails }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-foreground">Choose Package</h2>
    
    <div className="space-y-4">
      {Object.entries(pujaPackages).map(([key, pkg]) => (
        <motion.div
          key={key}
          className={`p-4 rounded-xl border transition-colors ${
            bookingData.package === key
              ? 'bg-primary/10 border-primary'
              : 'bg-card border-border hover:border-primary/50'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">{pkg.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">
                  ₹{Math.round(puja.basePrice * pkg.priceMultiplier).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">({pkg.duration})</span>
              </div>
            </div>
            <button
              onClick={() => onShowPackageDetails(key)}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
            >
              <Info size={20} />
            </button>
          </div>
          
          <p className="text-muted-foreground text-sm mb-3">{pkg.description}</p>
          
          <div className="space-y-1 mb-4">
            {pkg.includes.slice(0, 3).map((item, index) => (
              <div key={index} className="text-sm text-muted-foreground flex items-center">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                {item}
              </div>
            ))}
            {pkg.includes.length > 3 && (
              <div className="text-sm text-primary">
                +{pkg.includes.length - 3} more inclusions
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={() => updateData({ package: key })}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                bookingData.package === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {bookingData.package === key ? 'Selected' : 'Select'}
            </motion.button>
            <motion.button
              onClick={() => onShowPackageDetails(key)}
              className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Details
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const CateringStep = ({ bookingData, updateData }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-foreground">Catering & Guests</h2>
      <motion.button
        onClick={() => updateData({ skipCatering: !bookingData.skipCatering })}
        className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
          bookingData.skipCatering 
            ? 'bg-muted text-foreground border-border' 
            : 'bg-background text-muted-foreground border-border hover:border-primary/50'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <SkipForward size={16} className="mr-2" />
        {bookingData.skipCatering ? 'Include Catering' : 'Skip Catering'}
      </motion.button>
    </div>

    {bookingData.skipCatering ? (
      <div className="text-center py-8">
        <div className="bg-muted/50 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <SkipForward size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Catering Skipped</h3>
        <p className="text-muted-foreground">
          You can arrange your own refreshments or add catering later.
        </p>
      </div>
    ) : (
      <>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <Users size={16} className="inline mr-2" />
            Number of Guests *
          </label>
          <input
            type="number"
            value={bookingData.guestCount}
            onChange={(e) => updateData({ guestCount: parseInt(e.target.value) || 0 })}
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
            min="1"
            max="200"
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-foreground">Catering Options *</h3>
          {Object.entries(cateringOptions).map(([key, option]) => (
            <motion.div
              key={key}
              onClick={() => updateData({ catering: key })}
              className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                bookingData.catering === key
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card border-border hover:border-primary/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-foreground">{option.name}</h4>
                <span className="text-lg font-bold text-primary">
                  ₹{(option.pricePerPerson * bookingData.guestCount).toLocaleString()}
                </span>
              </div>
              <p className="text-muted-foreground text-sm mb-3">{option.description}</p>
              <div className="text-sm text-muted-foreground">
                {option.items.join(' • ')}
              </div>
            </motion.div>
          ))}
        </div>
      </>
    )}

    {/* Validation Messages */}
    {!bookingData.skipCatering && (
      <div className="text-sm text-muted-foreground">
        <p>* Required fields</p>
        {bookingData.guestCount <= 0 && (
          <p className="text-destructive">Please enter number of guests</p>
        )}
        {!bookingData.catering && (
          <p className="text-destructive">Please select a catering option</p>
        )}
      </div>
    )}
  </div>
);

const AddOnsStep = ({ bookingData, updateData, onAddToBasket, total }) => {
  const toggleAddOn = (addonId) => {
    const currentAddOns = bookingData.addOns || [];
    const updatedAddOns = currentAddOns.includes(addonId)
      ? currentAddOns.filter(id => id !== addonId)
      : [...currentAddOns, addonId];
    updateData({ addOns: updatedAddOns });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Add-ons & Extras</h2>
      <p className="text-muted-foreground text-sm">Optional services to enhance your puja experience</p>
      
      <div className="space-y-4">
        {addOnServices.map((addon) => (
          <motion.div
            key={addon.id}
            onClick={() => toggleAddOn(addon.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-colors ${
              bookingData.addOns?.includes(addon.id)
                ? 'bg-primary/10 border-primary'
                : 'bg-card border-border hover:border-primary/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                    bookingData.addOns?.includes(addon.id)
                      ? 'bg-primary border-primary'
                      : 'border-border'
                  }`}>
                    {bookingData.addOns?.includes(addon.id) && (
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground">{addon.name}</h4>
                </div>
                <p className="text-muted-foreground text-sm ml-7">{addon.description}</p>
              </div>
              <span className="text-lg font-bold text-primary ml-4">
                ₹{addon.price.toLocaleString()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Special Requests (Optional)
        </label>
        <textarea
          value={bookingData.specialRequests}
          onChange={(e) => updateData({ specialRequests: e.target.value })}
          placeholder="Any special requirements or requests..."
          className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
          rows="3"
        />
      </div>

      {/* Final Review Card */}
      {/* <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-4 border border-primary/20">
        <h3 className="font-semibold text-foreground mb-3">Booking Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Puja:</span>
            <span className="text-foreground">{bookingData.puja?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Package:</span>
            <span className="text-foreground">{pujaPackages[bookingData.package]?.name}</span>
          </div>
          {!bookingData.skipCatering && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Catering:</span>
              <span className="text-foreground">{cateringOptions[bookingData.catering]?.name} ({bookingData.guestCount} guests)</span>
            </div>
          )}
          {bookingData.addOns?.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Add-ons:</span>
              <span className="text-foreground">{bookingData.addOns.length} selected</span>
            </div>
          )}
        </div>
        
        <div className="border-t border-primary/20 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-foreground">Total Amount:</span>
            <span className="text-2xl font-bold text-primary">₹{total.toLocaleString()}</span>
          </div>
        </div>

        <motion.button
          onClick={onAddToBasket}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-lg mt-4 flex items-center justify-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ShoppingBag size={20} className="mr-2" />
          Add to Basket
        </motion.button>
      </div> */}
    </div>
  );
};

// Remove ReviewStep as it's no longer needed

export default PujaBookingDetails;