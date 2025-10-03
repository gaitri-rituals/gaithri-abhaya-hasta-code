import React, { useState, useCallback, useEffect } from "react";
import { GoogleMap, useLoadScript, Autocomplete } from "@react-google-maps/api";
import { motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";

const libraries = ["places"];
const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 12.9716, lng: 77.5946 };

export default function AddressMapModal({
  onClose,
  onConfirm,
  initialLocation = null,
}) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAn-fUcp17gySySUm4lig0DYaML6ZY5Lrc",
    libraries,
    language: "en",
    region: "IN",
  });

  const [mapRef, setMapRef] = useState(null);
  const [center, setCenter] = useState(initialLocation || defaultCenter);
  const [selected, setSelected] = useState("Fetching address...");
  const [autocomplete, setAutocomplete] = useState(null);
  const [currentLocationData, setCurrentLocationData] = useState(null);

  // Reverse geocoding
  const getAddress = useCallback((lat, lng) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        const address = results[0].formatted_address;
        setSelected(address);

        // Store complete address data
        setCurrentLocationData({
          id: `location-${Date.now()}`,
          fullName: address,
          shortName: "Selected Location",
          type: "location",
          coordinates: { lat, lng },
        });
      }
    });
  }, []);

  const handleCenterChanged = () => {
    if (mapRef) {
      const newCenter = mapRef.getCenter();
      const lat = newCenter.lat();
      const lng = newCenter.lng();
      setCenter({ lat, lng });
      getAddress(lat, lng);
    }
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const newCenter = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCenter(newCenter);
        mapRef.panTo(newCenter);
        getAddress(newCenter.lat, newCenter.lng);
      }
    }
  };

  useEffect(() => {
    // Get address for initial location when map loads
    if (initialLocation && isLoaded) {
      getAddress(initialLocation.lat, initialLocation.lng);
    }
  }, [initialLocation, isLoaded, getAddress]);

  useEffect(() => {
    const handleUpdate = (e) => {
      const { lat, lng } = e.detail;
      setCenter({ lat, lng });
      getAddress(lat, lng);
      if (mapRef) mapRef.panTo({ lat, lng });
    };

    window.addEventListener("update-map-center", handleUpdate);
    return () => window.removeEventListener("update-map-center", handleUpdate);
  }, [mapRef, getAddress]);

  if (!isLoaded) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md shadow-festival bg-muted/40 z-50 flex flex-col">
      {/* Header with Apple-like search */}
      <div className="p-4 flex items-center gap-3 border-b">
        {/* Back Button */}
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Autocomplete Input Full Width */}
        <Autocomplete
          onLoad={(ac) => setAutocomplete(ac)}
          onPlaceChanged={onPlaceChanged}
          className="flex-1"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search an area or address"
              className="w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 shadow-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:outline-none text-sm transition"
            />
          </div>
        </Autocomplete>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={16}
          center={center}
          options={{ disableDefaultUI: true }}
          onLoad={(map) => setMapRef(map)}
          onDragEnd={handleCenterChanged}
        />

        {/* Floating mascot pin */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="absolute inset-0 flex justify-center items-center pointer-events-none"
        >
          <img
            src="/map-pin.png"
            alt="pin"
            className="w-16 h-16 drop-shadow-xl"
          />
        </motion.div>
      </div>

      {/* Bottom Sheet with animation */}
      <motion.div
        initial={{ y: 200 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="p-4 border-t bg-white rounded-t-3xl shadow-lg"
      >
        <h1 variant="h4" className="font-bold text-gray-900">
          Choose Your Location
        </h1>
        <h2 variant="small" className="pb-2 text-gray-500">
          {selected}
        </h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full bg-black text-white py-3 rounded-2xl font-medium shadow-md hover:shadow-lg transition"
          onClick={() => {
            if (currentLocationData && onConfirm) {
              onConfirm(currentLocationData);
            }
            onClose();
          }}
        >
          Confirm & Proceed
        </motion.button>
      </motion.div>
    </div>
  );
}
