import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Navigation, 
  ShoppingBag, 
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
  Plus,
  Minus,
  X,
  MapPin,
  Clock,
  IndianRupee
} from 'lucide-react';
import useBasketStore from '../store/basketStore';
import { toast } from 'sonner';
import InnerPageWrapper from '../components/InnerPageWrapper';
import { templeAPI, referenceAPI } from '../services/api';

const TempleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [temple, setTemple] = useState(null);
  const [services, setServices] = useState([]);
  const [categorizedServices, setCategorizedServices] = useState({
    dakshiney: [],
    abhisheka_archana: [],
    other: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('bio');
  const { basketItems = [], addToBasket, fetchBasket, getBasketItemCount } = useBasketStore();
  const [expandedBio, setExpandedBio] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [devoteeForm, setDevoteeForm] = useState({
    name: '',
    dob: '',
    nakshatra: '',
    gothra: '',
    preferredTime: ''
  });
  const [devotees, setDevotees] = useState([]);
  const [donationAmount, setDonationAmount] = useState('');
  const [nakshatras, setNakshatras] = useState([]);
  const [gothras, setGothras] = useState([]);
  const [selectedAmounts, setSelectedAmounts] = useState({}); // Track selected amounts for each service
  const [customAmountModal, setCustomAmountModal] = useState({ isOpen: false, service: null, amount: '' });
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [bookingTime, setBookingTime] = useState('10:00');

  const tabRefs = useRef({});
  const tabs = [
    { id: 'bio', label: 'Temple BIO' },
    { id: 'dakshiney', label: 'Dakshiney' },
    { id: 'abhisheka_archana', label: 'Abhisheka / Archana' }
  ];

  useEffect(() => {
    const fetchTempleDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        fetchBasket();
        
        const templeResponse = await templeAPI.getById(id);
        const templeData = templeResponse?.temple || templeResponse?.data || templeResponse;
        
        if (!templeData) {
          throw new Error('Temple not found');
        }
        
        setTemple(templeData);
        
        try {
          const servicesResponse = await templeAPI.getServices(id);
          const servicesData = servicesResponse?.services || servicesResponse?.data || [];
          
          if (Array.isArray(servicesData)) {
            const transformedServices = servicesData.map(service => {
              const baseService = {
                id: service.id,
                name: service.name,
                description: service.description,
                price: parseFloat(service.price),
                duration: service.duration,
                category: service.category,
                pricing_type: service.pricing_type,
                pricing_options: service.pricing_options
              };

              if (service.category === 'donation') {
                return {
                  ...baseService,
                  type: 'donation',
                  presets: service.pricing_options?.presets || [51, 101, 501, 1001]
                };
              } else if (service.category === 'ritual') {
                if (service.name.toLowerCase().includes('archana')) {
                  return {
                    ...baseService,
                    type: 'archana',
                    fields: ["name", "dob", "nakshatra", "gothra"]
                  };
                } else if (service.name.toLowerCase().includes('abhisheka')) {
                  return {
                    ...baseService,
                    type: 'abhisheka',
                    fields: ["name", "dob", "preferredTime"]
                  };
                } else {
                  return {
                    ...baseService,
                    type: 'ritual',
                    fields: ["name", "dob"]
                  };
                }
              } else {
                return {
                  ...baseService,
                  type: 'general',
                  fields: ["name"]
                };
              }
            });
            
            // Categorize services based on their properties
            const categorized = {
              dakshiney: [],
              abhisheka_archana: [],
              other: []
            };
            
            transformedServices.forEach(service => {
              const serviceName = service.name.toLowerCase();
              const serviceCategory = service.category?.toLowerCase();
              
              // Categorize based on service name and type
              if (serviceCategory === 'donation' || serviceName.includes('dakshiney') || serviceName.includes('donation')) {
                categorized.dakshiney.push(service);
              } else if (serviceName.includes('abhisheka') || serviceName.includes('archana') || service.type === 'archana' || service.type === 'abhisheka') {
                categorized.abhisheka_archana.push(service);
              } else {
                categorized.other.push(service);
              }
            });
            
            setServices(transformedServices);
            setCategorizedServices(categorized);
          }
        } catch (servicesErr) {
          console.log('Services not available for this temple:', servicesErr);
          
          // Add sample services for testing
          const sampleServices = [
            {
              id: 'sample-1',
              name: 'Dakshiney Donation',
              description: 'General donation to the temple',
              price: 51,
              duration: '5 minutes',
              category: 'donation',
              type: 'donation',
              presets: [51, 101, 501, 1001]
            },
            {
              id: 'sample-2',
              name: 'Abhisheka Seva',
              description: 'Special abhisheka ritual for the deity',
              price: 501,
              duration: '30 minutes',
              category: 'ritual',
              type: 'abhisheka',
              fields: ["name", "dob", "preferredTime"]
            },
            {
              id: 'sample-3',
              name: 'Archana Seva',
              description: 'Traditional archana with flowers and prayers',
              price: 101,
              duration: '15 minutes',
              category: 'ritual',
              type: 'archana',
              fields: ["name", "dob", "nakshatra", "gothra"]
            }
          ];
          
          // Categorize sample services
          const categorized = {
            dakshiney: [sampleServices[0]],
            abhisheka_archana: [sampleServices[1], sampleServices[2]],
            other: []
          };
          
          setServices(sampleServices);
          setCategorizedServices(categorized);
        }
      } catch (err) {
        console.error('Failed to fetch temple details:', err);
        setError(err.message || 'Failed to load temple details');
        toast.error('Failed to load temple details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTempleDetails();
    }
  }, [id]);

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [nakshatrasResponse, gothrasResponse] = await Promise.all([
          referenceAPI.getNakshatras(),
          referenceAPI.getGothras()
        ]);
        
        setNakshatras(nakshatrasResponse?.nakshatras || []);
        setGothras(gothrasResponse?.gothras || []);
      } catch (err) {
        console.error('Failed to fetch reference data:', err);
      }
    };

    fetchReferenceData();
  }, []);

  // Auto-scroll selected tab into view
  useEffect(() => {
    if (tabRefs.current[activeTab]) {
      tabRefs.current[activeTab].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeTab]);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setDevoteeForm({
      name: '',
      dob: '',
      nakshatra: '',
      gothra: '',
      preferredTime: ''
    });
    setDevotees([]);
    setDonationAmount('');
  };

  const handleAmountSelection = (service, amount) => {
    // Track selected amount for this service
    setSelectedAmounts(prev => ({
      ...prev,
      [service.id]: amount
    }));
  };

  const handleAddToCart = async (service) => {
    const selectedAmount = selectedAmounts[service.id];
    if (!selectedAmount) {
      toast.error('Please select an amount first');
      return;
    }

    try {
      // Format data according to backend API expectations
      const basketItem = {
        serviceType: 'temple',
        temple_id: temple.id,
        service_id: service.id,
        quantity: 1,
        amount: selectedAmount,
        totalAmount: selectedAmount,
        booking_date: new Date().toISOString().split('T')[0],
        booking_time: '10:00:00',
        special_requests: '',
        devotee_details: [],
        serviceName: service.name,
        templeName: temple.name,
        category: service.category
      };
      
      await addToBasket(basketItem);
      
      // Show success feedback
      toast.success(`Added ${service.name} (₹${selectedAmount}) to basket`);
      
      // Clear selected amount after adding to cart
      setSelectedAmounts(prev => ({
        ...prev,
        [service.id]: null
      }));
    } catch (error) {
      console.error('Error adding to basket:', error);
      toast.error('Failed to add item to basket. Please try again.');
    }
  };

  const handleCustomAmountClick = (service) => {
    setCustomAmountModal({ isOpen: true, service, amount: '' });
  };

  const handleCustomAmountSubmit = () => {
    const { service, amount } = customAmountModal;
    const numericAmount = parseFloat(amount);
    
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    // Check if amount is within allowed range
    if (service.pricing_options.minAmount && numericAmount < service.pricing_options.minAmount) {
      toast.error(`Minimum amount is ₹${service.pricing_options.minAmount}`);
      return;
    }
    if (service.pricing_options.maxAmount && numericAmount > service.pricing_options.maxAmount) {
      toast.error(`Maximum amount is ₹${service.pricing_options.maxAmount}`);
      return;
    }
    
    handleAmountSelection(service, numericAmount);
    setCustomAmountModal({ isOpen: false, service: null, amount: '' });
  };

  const handleBasketClick = () => {
    navigate('/basket');
  };

  const handleBackClick = () => {
    navigate('/explore-temples');
  };

  const rightContent = (
    <motion.button
      onClick={handleBasketClick}
      className="p-2 hover:bg-muted rounded-full transition-colors relative"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <ShoppingBag size={20} className="text-foreground" />
      {getBasketItemCount() > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {getBasketItemCount()}
        </span>
      )}
    </motion.button>
  );

  const renderServiceCard = (service) => {
    const isFlexiblePricing = service.pricing_type === 'flexible' && service.pricing_options;
    const presets = isFlexiblePricing ? service.pricing_options.presets : [];
    
    return (
      <motion.div
        key={service.id}
        className="bg-white rounded-xl p-4 border border-border hover:shadow-md transition-shadow"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">{service.name}</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            {service.category}
          </span>
        </div>
        
        {service.description && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{service.description}</p>
        )}

        {isFlexiblePricing ? (
          <div className="space-y-3">
            {/* Amount Selection Badges */}
            <div className="flex flex-wrap gap-2">
              {presets.map((amount) => (
                <motion.button
                  key={amount}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedAmounts[service.id] === amount
                      ? 'bg-primary text-white'
                      : 'bg-primary/10 hover:bg-primary hover:text-white text-primary'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAmountSelection(service, amount)}
                >
                  ₹{amount}
                </motion.button>
              ))}
              {service.pricing_options.allowCustom && (
                <motion.button
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedAmounts[service.id] && !presets.includes(selectedAmounts[service.id])
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCustomAmountClick(service)}
                >
                  {selectedAmounts[service.id] && !presets.includes(selectedAmounts[service.id])
                    ? `₹${selectedAmounts[service.id]}`
                    : 'Other'
                  }
                </motion.button>
              )}
            </div>
            
            {/* Add to Cart Button - appears when amount is selected */}
            {/* {selectedAmounts[service.id] && ( */}
              <motion.button
                className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAddToCart(service)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                disabled={!selectedAmounts}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
                </svg>
                Add to Cart - ₹{selectedAmounts[service.id]}
              </motion.button>
            {/* )} */}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-primary font-semibold">
                <IndianRupee size={16} />
                <span>{service.price}</span>
              </div>
              {service.duration && service.category !== 'Donation' && (
                <div className="flex items-center text-muted-foreground text-sm">
                  <Clock size={14} className="mr-1" />
                  <span>{service.duration} min</span>
                </div>
              )}
            </div>
            
            {/* Add to Cart Button for fixed pricing */}
            <motion.button
              className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                try {
                  // Format data according to basket store expectations
                  const basketItem = {
                    serviceType: 'temple',
                    temple_id: temple.id,
                    service_id: service.id,
                    quantity: 1,
                    amount: service.price,
                    booking_date: new Date().toISOString().split('T')[0],
                    booking_time: '10:00',
                    special_requests: '',
                    devotee_details: [],
                    serviceName: service.name,
                    templeName: temple.name,
                    category: service.category
                  };
                  
                  await addToBasket(basketItem);
                  toast.success(`Added ${service.name} (₹${service.price}) to basket`);
                } catch (error) {
                  console.error('Error adding to basket:', error);
                  toast.error('Failed to add item to basket. Please try again.');
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
              </svg>
              Add to Cart - ₹{service.price}
            </motion.button>
          </div>
        )}
      </motion.div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bio':
        return (
          <div className="space-y-6">
            {/* Temple Image */}
            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden mb-6">
                <img
                  src={temple.images?.[0] || temple.heroImages?.[0] || temple.image || '/placeholder-temple.jpg'}
                  alt={temple.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Temple Title and Location */}
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-foreground mb-2">{temple.name}</h1>
                <div className="flex items-center">
                  <MapPin size={16} className="text-primary mr-2" />
                  <p className="text-muted-foreground">
                    {temple.address?.city || ''}{temple.address?.city && temple.address?.state ? ', ' : ''}{temple.address?.state || ''}
                  </p>
                </div>
                
                {/* Navigate Button */}
                <motion.button
                  onClick={() => {
                    const lat = temple.address?.coordinates?.latitude;
                    const lng = temple.address?.coordinates?.longitude;
                    if (lat && lng) {
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                        '_blank'
                      );
                    }
                  }}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center mt-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Navigation size={16} className="mr-2" />
                  Navigate in Maps
                </motion.button>
              </div>
            </div>

            {/* Temple Bio Section */}
            <div className="bg-white rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold mb-4">About {temple?.name}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Primary Deity</p>
                  <p className="font-medium">{temple?.primaryDeity || temple?.deity || 'Not specified'}</p>
                </div>
                {temple?.description && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Description</p>
                    <p className={`text-foreground ${!expandedBio ? 'line-clamp-3' : ''}`}>
                      {typeof temple.description === 'string' ? temple.description : 'No description available'}
                    </p>
                    {(typeof temple.description === 'string' && temple.description.length > 150) && (
                      <button
                        onClick={() => setExpandedBio(!expandedBio)}
                        className="text-primary text-sm font-medium mt-2 flex items-center"
                      >
                        {expandedBio ? 'Show Less' : 'Read More'}
                        {expandedBio ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
                      </button>
                    )}
                  </div>
                )}
                {temple?.timings && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Temple Timings</p>
                    <p className="font-medium">{typeof temple.timings === 'string' ? temple.timings : 'Timings not available'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            {(temple?.contact?.phone || temple?.contact?.email) && (
              <div className="bg-white rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-2">
                  {temple.contact.phone && (
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Phone: </span>
                      {typeof temple.contact.phone === 'string' ? temple.contact.phone : 'Not available'}
                    </p>
                  )}
                  {temple.contact.email && (
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Email: </span>
                      {typeof temple.contact.email === 'string' ? temple.contact.email : 'Not available'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'dakshiney':
        return (
          <div className="space-y-4">
            {categorizedServices.dakshiney.length > 0 ? (
              categorizedServices.dakshiney.map(service => renderServiceCard(service))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No Dakshiney services available</p>
              </div>
            )}
          </div>
        );

      case 'abhisheka_archana':
        return (
          <div className="space-y-4">
            {categorizedServices.abhisheka_archana.length > 0 ? (
              categorizedServices.abhisheka_archana.map(service => renderServiceCard(service))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No Abhisheka/Archana services available</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <InnerPageWrapper
        title="Temple Details"
        onBackClick={handleBackClick}
        rightContent={rightContent}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading temple details...</p>
          </div>
        </div>
      </InnerPageWrapper>
    );
  }

  if (error || !temple) {
    return (
      <InnerPageWrapper
        title="Temple Details"
        onBackClick={handleBackClick}
        rightContent={rightContent}
      >
        <div className="text-center py-12">
          <p className="text-red-500 text-lg mb-2">Error loading temple details</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-primary text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </InnerPageWrapper>
    );
  }

  return (
    <InnerPageWrapper
      title={temple.name}
      onBackClick={handleBackClick}
      rightContent={rightContent}
    >
      <div className="pb-20">
        {/* Tab Navigation - Moved to Top */}
        <div className="sticky top-16 p-3 z-20 backdrop-blur-md shadow-festival bg-gradient-to-br from-gray-300 via-orange-50 to-gray-300">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide relative">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                ref={(el) => (tabRefs.current[tab.id] = el)}
                onClick={() => setActiveTab(tab.id)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap`}
              >
                {/* Animated background */}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary text-white rounded-full shadow"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}

                {/* Text must stay above background */}
                <span
                  className={`relative z-10 ${
                    activeTab === tab.id ? "text-white" : "text-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>

      {/* Custom Amount Modal */}
      {customAmountModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-xl p-6 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4">
              Enter Custom Amount for {customAmountModal.service?.name}
            </h3>
            
            {customAmountModal.service?.pricing_options?.minAmount && (
              <p className="text-sm text-muted-foreground mb-2">
                Minimum: ₹{customAmountModal.service.pricing_options.minAmount}
              </p>
            )}
            
            {customAmountModal.service?.pricing_options?.maxAmount && (
              <p className="text-sm text-muted-foreground mb-4">
                Maximum: ₹{customAmountModal.service.pricing_options.maxAmount}
              </p>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Amount (₹)</label>
              <input
                type="number"
                value={customAmountModal.amount}
                onChange={(e) => setCustomAmountModal(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomAmountSubmit();
                  }
                }}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setCustomAmountModal({ isOpen: false, service: null, amount: '' })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomAmountSubmit}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </InnerPageWrapper>
  );
};

export default TempleDetails;