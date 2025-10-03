import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Briefcase, MapPin } from "lucide-react";

const AddressConfirmModal = ({ address, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    type: "home",
    label: "Home",
    street: "",
    city: "",
    state: "",
    zip_code: "",
    country: "India",
  });

  useEffect(() => {
    if (address) {
      // Parse address from Google Maps formatted_address
      const fullAddress = address.fullName || "";
      const parts = fullAddress.split(",").map(part => part.trim());
      
      // Extract city, state, and zip from the formatted address
      let city = "";
      let state = "";
      let zipCode = "";
      
      // Try to extract from parts (usually: street, area, city, state zipcode, country)
      if (parts.length >= 3) {
        // Usually the city is before the last 2 parts
        city = parts[parts.length - 3] || "";
        
        // State and zip are usually in "Karnataka 560023" format
        const stateZipPart = parts[parts.length - 2] || "";
        const stateZipMatch = stateZipPart.match(/^(.+?)\s+(\d{6})$/);
        if (stateZipMatch) {
          state = stateZipMatch[1];
          zipCode = stateZipMatch[2];
        } else {
          state = stateZipPart;
        }
      }
      
      // Pre-fill with Google Maps data
      setFormData({
        type: "home",
        label: "Home",
        street: fullAddress,
        city: city,
        state: state,
        zip_code: zipCode,
        country: "India",
      });
    }
  }, [address]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formData);
  };

  const addressTypes = [
    { value: "home", label: "Home", icon: Home },
    { value: "work", label: "Office", icon: Briefcase },
    { value: "other", label: "Other", icon: MapPin },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Confirm Address Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Address Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Address Type *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {addressTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, type: type.value, label: type.label })
                      }
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.type === type.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Street Address *
              </label>
              <textarea
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                placeholder="Building, Street, Area"
                className="input-divine w-full min-h-[80px]"
                required
              />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="City"
                  className="input-divine w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="State"
                  className="input-divine w-full"
                  required
                />
              </div>
            </div>

            {/* ZIP Code & Country */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) =>
                    setFormData({ ...formData, zip_code: e.target.value })
                  }
                  placeholder="000000"
                  className="input-divine w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="input-divine w-full"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-divine py-3"
              >
                Save Address
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddressConfirmModal;
