import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DevoteeDetailsForm = ({ onSubmit, onCancel, nakshatras, gothras, service }) => {
  const [devotees, setDevotees] = useState([{
    id: 1,
    name: '',
    dob: '',
    nakshatra: '',
    gothra: '',
    pob: '',
    email: '',
    phone: ''
  }]);

  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (devoteeId, field, value) => {
    setDevotees(prev => prev.map(devotee => 
      devotee.id === devoteeId 
        ? { ...devotee, [field]: value }
        : devotee
    ));
    
    // Clear error when user starts typing
    const errorKey = `${devoteeId}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const addDevotee = () => {
    const newId = Math.max(...devotees.map(d => d.id)) + 1;
    setDevotees(prev => [...prev, {
      id: newId,
      name: '',
      dob: '',
      nakshatra: '',
      gothra: '',
      pob: '',
      email: '',
      phone: ''
    }]);
  };

  const removeDevotee = (devoteeId) => {
    if (devotees.length > 1) {
      setDevotees(prev => prev.filter(devotee => devotee.id !== devoteeId));
      // Clear errors for removed devotee
      setErrors(prev => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach(key => {
          if (key.startsWith(`${devoteeId}_`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate each devotee
    devotees.forEach(devotee => {
      const { id } = devotee;

      if (!devotee.name.trim()) {
        newErrors[`${id}_name`] = 'Name is required';
      }

      if (!devotee.dob) {
        newErrors[`${id}_dob`] = 'Date of Birth is required';
      }

      if (!devotee.nakshatra) {
        newErrors[`${id}_nakshatra`] = 'Nakshatra is required';
      }

      if (!devotee.gothra) {
        newErrors[`${id}_gothra`] = 'Gothra is required';
      }

      if (!devotee.pob.trim()) {
        newErrors[`${id}_pob`] = 'Place of Birth is required';
      }

      // Email validation (optional but if provided should be valid)
      if (devotee.email && !/\S+@\S+\.\S+/.test(devotee.email)) {
        newErrors[`${id}_email`] = 'Please enter a valid email address';
      }

      // Phone validation (optional but if provided should be valid)
      if (devotee.phone && !/^\d{10}$/.test(devotee.phone.replace(/\D/g, ''))) {
        newErrors[`${id}_phone`] = 'Please enter a valid 10-digit phone number';
      }
    });

    // Amount validation for flexible pricing services
    const isFlexiblePricing = service?.pricing_type === 'flexible' && service?.pricing_options;
    if (isFlexiblePricing) {
      if (!selectedAmount && !customAmount) {
        newErrors.amount = 'Please select an amount';
      }
      if (showCustomAmount && (!customAmount || isNaN(customAmount) || parseFloat(customAmount) <= 0)) {
        newErrors.customAmount = 'Please enter a valid amount';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const finalAmount = showCustomAmount ? parseFloat(customAmount) : selectedAmount || service?.price;
      onSubmit({
        devoteeDetails: devotees,
        amount: finalAmount
      });
    }
  };

  const renderDevoteeForm = (devotee, index) => (
    <motion.div
      key={devotee.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50"
    >
      {/* Devotee Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800">
          Devotee {index + 1}
        </h3>
        {devotees.length > 1 && (
          <motion.button
            type="button"
            onClick={() => removeDevotee(devotee.id)}
            className="text-red-500 hover:text-red-700 p-1"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Name Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          value={devotee.name}
          onChange={(e) => handleInputChange(devotee.id, 'name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors[`${devotee.id}_name`] ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter devotee's full name"
        />
        {errors[`${devotee.id}_name`] && <p className="text-red-500 text-xs mt-1">{errors[`${devotee.id}_name`]}</p>}
      </div>

      {/* Date of Birth Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date of Birth *
        </label>
        <input
          type="date"
          value={devotee.dob}
          onChange={(e) => handleInputChange(devotee.id, 'dob', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors[`${devotee.id}_dob`] ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors[`${devotee.id}_dob`] && <p className="text-red-500 text-xs mt-1">{errors[`${devotee.id}_dob`]}</p>}
      </div>

      {/* Nakshatra Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nakshatra *
        </label>
        <select
          value={devotee.nakshatra}
          onChange={(e) => handleInputChange(devotee.id, 'nakshatra', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors[`${devotee.id}_nakshatra`] ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select Nakshatra</option>
          {nakshatras.map((nakshatra, index) => (
            <option key={index} value={nakshatra}>
              {nakshatra}
            </option>
          ))}
        </select>
        {errors[`${devotee.id}_nakshatra`] && <p className="text-red-500 text-xs mt-1">{errors[`${devotee.id}_nakshatra`]}</p>}
      </div>

      {/* Gothra Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gothra *
        </label>
        <select
          value={devotee.gothra}
          onChange={(e) => handleInputChange(devotee.id, 'gothra', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors[`${devotee.id}_gothra`] ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select Gothra</option>
          {gothras.map((gothra, index) => (
            <option key={index} value={gothra}>
              {gothra}
            </option>
          ))}
        </select>
        {errors[`${devotee.id}_gothra`] && <p className="text-red-500 text-xs mt-1">{errors[`${devotee.id}_gothra`]}</p>}
      </div>

      {/* Place of Birth Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Place of Birth *
        </label>
        <input
          type="text"
          value={devotee.pob}
          onChange={(e) => handleInputChange(devotee.id, 'pob', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors[`${devotee.id}_pob`] ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter place of birth (city, state)"
        />
        {errors[`${devotee.id}_pob`] && <p className="text-red-500 text-xs mt-1">{errors[`${devotee.id}_pob`]}</p>}
      </div>

      {/* Email Field (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email (Optional)
        </label>
        <input
          type="email"
          value={devotee.email}
          onChange={(e) => handleInputChange(devotee.id, 'email', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors[`${devotee.id}_email`] ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter email address"
        />
        {errors[`${devotee.id}_email`] && <p className="text-red-500 text-xs mt-1">{errors[`${devotee.id}_email`]}</p>}
      </div>

      {/* Phone Field (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number (Optional)
        </label>
        <input
          type="tel"
          value={devotee.phone}
          onChange={(e) => handleInputChange(devotee.id, 'phone', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors[`${devotee.id}_phone`] ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter 10-digit phone number"
        />
        {errors[`${devotee.id}_phone`] && <p className="text-red-500 text-xs mt-1">{errors[`${devotee.id}_phone`]}</p>}
      </div>
    </motion.div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Devotees Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Devotee Information</h2>
          <motion.button
            type="button"
            onClick={addDevotee}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Devotee
          </motion.button>
        </div>

        <AnimatePresence>
          {devotees.map((devotee, index) => renderDevoteeForm(devotee, index))}
        </AnimatePresence>
      </div>

      {/* Amount Selection for Flexible Pricing */}
      {service?.pricing_type === 'flexible' && service?.pricing_options && (
        <div className="border-t pt-4 bg-white rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Amount *
          </label>
          <div className="space-y-3">
            {/* Preset Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {service.pricing_options.presets?.map((amount) => (
                <motion.button
                  key={amount}
                  type="button"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedAmount === amount && !showCustomAmount
                      ? 'bg-orange-500 text-white'
                      : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setShowCustomAmount(false);
                    setCustomAmount('');
                    setErrors(prev => ({ ...prev, amount: '', customAmount: '' }));
                  }}
                >
                  ₹{amount}
                </motion.button>
              ))}
              {service.pricing_options.allowCustom && (
                <motion.button
                  type="button"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showCustomAmount
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowCustomAmount(true);
                    setSelectedAmount(null);
                    setErrors(prev => ({ ...prev, amount: '' }));
                  }}
                >
                  Custom Amount
                </motion.button>
              )}
            </div>

            {/* Custom Amount Input */}
            {showCustomAmount && (
              <div>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setErrors(prev => ({ ...prev, customAmount: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.customAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter custom amount"
                  min="1"
                />
                {errors.customAmount && <p className="text-red-500 text-xs mt-1">{errors.customAmount}</p>}
              </div>
            )}
          </div>
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>
      )}

      {/* Fixed Price Display */}
      {service?.pricing_type !== 'flexible' && service?.price && (
        <div className="border-t pt-4 bg-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Service Amount:</span>
            <span className="text-lg font-semibold text-orange-600">₹{service.price}</span>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Summary</h3>
        <div className="text-sm text-blue-700">
          <p>Total Devotees: <span className="font-medium">{devotees.length}</span></p>
          {(selectedAmount || customAmount || service?.price) && (
            <p>Amount per service: <span className="font-medium">₹{showCustomAmount ? customAmount : selectedAmount || service?.price}</span></p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <motion.button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Add to Cart ({devotees.length} devotee{devotees.length > 1 ? 's' : ''})
        </motion.button>
      </div>
    </form>
  );
};

export default DevoteeDetailsForm;