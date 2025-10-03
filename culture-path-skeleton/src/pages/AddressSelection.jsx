import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  MapPin,
  Navigation,
  Clock,
  Star,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";
import { useAppStore } from "../state/store";
import AddressMapModal from "../components/AddressMapModal";
import EditAddressModal from "../components/EditAddressModal";
import AddressConfirmModal from "../components/AddressConfirmModal";
import { addressApi } from "../services/addressApi";

const AddressSelection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentAddress,
    savedAddresses,
    setCurrentAddress,
    addSavedAddress,
    removeSavedAddress,
    updateSavedAddress,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [backendAddresses, setBackendAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [placesService, setPlacesService] = useState(null);
  const [geocoder, setGeocoder] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapInitialLocation, setMapInitialLocation] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAddress, setPendingAddress] = useState(null);
  const mapRef = useRef(null);

  const MAPS_API_KEY = "AIzaSyAn-fUcp17gySySUm4lig0DYaML6ZY5Lrc";

  useEffect(() => {
    // Initialize Google Maps using new functional API
    const initializeGoogleMaps = async () => {
      try {
        // Load Google Maps script
        if (!window.google) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places,geometry`;
          script.async = true;
          document.head.appendChild(script);

          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }

        // Initialize Places service and Geocoder
        const map = new google.maps.Map(document.createElement("div"));
        const service = new google.maps.places.PlacesService(map);
        const geocoderService = new google.maps.Geocoder();
        setPlacesService(service);
        setGeocoder(geocoderService);
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    // Load addresses from backend
    const loadAddresses = async () => {
      try {
        setAddressesLoading(true);
        const response = await addressApi.getAll();
        if (response.success && response.data) {
          setBackendAddresses(response.data);
        }
      } catch (error) {
        console.error("Error loading addresses:", error);
        toast.error("Failed to load saved addresses");
      } finally {
        setAddressesLoading(false);
      }
    };

    initializeGoogleMaps();
    loadAddresses();
  }, []);

  useEffect(() => {
    // Search for places when query changes
    if (searchQuery.length > 2 && placesService) {
      setLoading(true);

      const request = {
        query: searchQuery,
        fields: ["place_id", "name", "formatted_address", "geometry", "types"],
      };

      placesService.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const formattedResults = results.slice(0, 5).map((place, index) => ({
            id: place.place_id,
            fullName: place.formatted_address,
            shortName: place.name,
            type: getPlaceType(place.types),
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
            distance: "Near you", // Could calculate actual distance if needed
          }));
          setSearchResults(formattedResults);
        } else {
          setSearchResults([]);
        }
        setLoading(false);
      });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, placesService]);

  const handleCurrentLocation = () => {
  setLocationLoading(true);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const initialLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setMapInitialLocation(initialLocation);
        setLocationLoading(false);
        setShowMapModal(true);
      },
      (error) => {
        console.error('Location error:', error);
        setLocationLoading(false);

        // Fallback to a default location (e.g., Bangalore center)
        const fallbackLocation = { lat: 12.9716, lng: 77.5946 };
        setMapInitialLocation(fallbackLocation);
        setShowMapModal(true);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("Location permission denied. Enable location in browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
             setFallbackMessage("Could not detect your location, showing default location.");
            break;
          case error.TIMEOUT:
            alert("Location request timed out. Showing default location.");
            break;
          default:
            alert("Unknown error. Showing default location.");
        }
      }
    );
  } else {
    setLocationLoading(false);
    alert("Geolocation not supported. Showing default location.");
    setMapInitialLocation({ lat: 12.9716, lng: 77.5946 });
    setShowMapModal(true);
  }
  };


  const handleMapConfirm = (locationData) => {
    // Show confirmation modal for map location
    setPendingAddress(locationData);
    setShowMapModal(false);
    setShowConfirmModal(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
  };

  const handleSaveEditedAddress = async (updatedAddress) => {
    try {
      const response = await addressApi.update(updatedAddress.id, {
        type: updatedAddress.type,
        label: updatedAddress.label,
        street: updatedAddress.street,
        city: updatedAddress.city,
        state: updatedAddress.state,
        zip_code: updatedAddress.zip_code,
        country: updatedAddress.country,
        is_default: updatedAddress.is_default,
      });
      
      if (response.success) {
        // Reload addresses from backend
        const refreshed = await addressApi.getAll();
        if (refreshed.success) {
          setBackendAddresses(refreshed.data);
        }
        toast.success("Address updated successfully");
      }
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error("Failed to update address");
    }
    setEditingAddress(null);
  };

  const handleSelectAddress = (address) => {
    setCurrentAddress(address);
    toast.success("Address selected successfully");

    // Check if we have return navigation data
    const returnTo = location.state?.returnTo;
    const returnData = location.state?.returnData;

    if (returnTo && returnData) {
      navigate(returnTo, { state: returnData });
    } else {
      // Navigate to home page after address selection
      navigate('/');
    }
  };

  // Handler for selecting address from search results - shows confirmation modal
  const handleSelectFromSearch = (address) => {
    setPendingAddress(address);
    setShowConfirmModal(true);
  };

  // Handler for confirming address details from modal
  const handleConfirmAddress = async (addressData) => {
    try {
      // Save the confirmed address to backend
      const response = await addressApi.add(addressData);
      
      if (response.success) {
        // Reload addresses from backend
        const refreshed = await addressApi.getAll();
        if (refreshed.success) {
          setBackendAddresses(refreshed.data);
        }
        toast.success("Address saved successfully");
        
        // Close modal and select the address
        setShowConfirmModal(false);
        setPendingAddress(null);
        
        // Navigate to homepage
        setCurrentAddress({
          ...addressData,
          id: response.data?.id,
        });
        navigate('/');
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    }
  };

  const handleSaveAddress = async (address) => {
    try {
      // Convert Google Maps data to backend format
      const addressData = {
        type: address.type || 'home',
        label: address.shortName || address.label || 'Address',
        street: address.fullName || address.street || '',
        city: address.city || '',
        state: address.state || '',
        zip_code: address.zip_code || address.postalCode || '000000',
        country: address.country || 'India',
        is_default: false,
      };

      const response = await addressApi.add(addressData);
      
      if (response.success) {
        // Reload addresses from backend
        const refreshed = await addressApi.getAll();
        if (refreshed.success) {
          setBackendAddresses(refreshed.data);
        }
        toast.success("Address saved successfully");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    }
  };

  const handleDeleteSavedAddress = async (addressId) => {
    try {
      const response = await addressApi.delete(addressId);
      
      if (response.success) {
        // Reload addresses from backend
        const refreshed = await addressApi.getAll();
        if (refreshed.success) {
          setBackendAddresses(refreshed.data);
        }
        toast.success("Address deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    }
  };

  const getPlaceType = (types) => {
    if (types.includes("hindu_temple") || types.includes("place_of_worship"))
      return "temple";
    if (types.includes("lodging") || types.includes("real_estate_agency"))
      return "residential";
    if (types.includes("shopping_mall") || types.includes("store"))
      return "commercial";
    return "location";
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case "temple":
        return "🏛️";
      case "residential":
        return "🏠";
      case "commercial":
        return "🏢";
      case "current":
        return "📍";
      default:
        return "📍";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-temple">
      {/* Header */}
      <header className="nav-divine px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">
            {t("address.title")}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("address.search")}
              className="input-divine w-full pl-12 py-4"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Current Location Button */}
        <motion.button
          onClick={handleCurrentLocation}
          disabled={locationLoading}
          className="card-divine w-full flex items-center gap-4 p-4 mb-6 hover:shadow-sacred transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="w-12 h-12 bg-gradient-divine rounded-full flex items-center justify-center">
            {locationLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Navigation size={24} className="text-white" />
            )}
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-foreground">
              {t("address.current")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {locationLoading
                ? "Getting your location..."
                : "Locate me automatically"}
            </p>
          </div>
        </motion.button>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Search Results
            </h3>
            <div className="space-y-2">
              {searchResults.map((address) => (
                <motion.div
                  key={address.id}
                  className="card-temple flex items-start gap-3 p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleSelectFromSearch(address)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="text-2xl mt-1">
                    {getAddressIcon(address.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">
                      {address.shortName}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {address.fullName}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-primary">
                        {address.distance}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Saved Addresses */}
        {addressesLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : backendAddresses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star size={20} className="text-primary" />
              {t("address.saved")}
            </h3>
            <div className="space-y-2">
              {backendAddresses.map((address) => (
                <motion.div
                  key={address.id}
                  className="card-temple hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleSelectAddress({
                    id: address.id,
                    shortName: address.label,
                    fullName: `${address.street}, ${address.city}, ${address.state}`,
                    type: address.type,
                    ...address
                  })}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="text-2xl mt-1">
                      {getAddressIcon(address.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">
                        {address.label}
                        {address.is_default && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {address.street}, {address.city}, {address.state} - {address.zip_code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAddress(address);
                        }}
                        className="p-1 hover:bg-muted rounded-full transition-colors"
                        title="Edit address"
                      >
                        <Edit2 size={16} className="text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSavedAddress(address.id);
                        }}
                        className="p-1 hover:bg-destructive/10 rounded-full transition-colors"
                        title="Delete address"
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading &&
          !addressesLoading &&
          searchQuery.length === 0 &&
          backendAddresses.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                <MapPin size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No addresses yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Search for an address or use your current location to get
                started
              </p>
            </motion.div>
          )}

        {/* Edit Address Modal */}
        {editingAddress && (
          <EditAddressModal
            address={editingAddress}
            onClose={() => setEditingAddress(null)}
            onSave={handleSaveEditedAddress}
          />
         )}

        {/* Address Map Modal */}
        {showMapModal && (
           <AddressMapModal
            onClose={() => setShowMapModal(false)}
            onConfirm={handleMapConfirm}
            initialLocation={mapInitialLocation}
          />
        )}

        {/* Address Confirmation Modal */}
        {showConfirmModal && pendingAddress && (
          <AddressConfirmModal
            address={pendingAddress}
            onClose={() => {
              setShowConfirmModal(false);
              setPendingAddress(null);
            }}
            onConfirm={handleConfirmAddress}
          />
        )}
      </main>
    </div>
  );
};

export default AddressSelection;
