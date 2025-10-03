import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../state/store";
import DivineBackground from "../components/ui/divineBackground";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading, authError, clearAuthError } = useAppStore();

  const [selectedCountry, setSelectedCountry] = useState({
    code: "+91",
    country: "India",
    flag: "🇮🇳",
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const pickerRef = useRef(null);
  const timeoutRef = useRef(null);

  const countryCodes = [
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+1", country: "USA", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+971", country: "UAE", flag: "🇦🇪" },
  ];

  // Close picker if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowCountryPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validatePhone = (value) => {
    const digits = (value || "").replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    clearAuthError();

    if (!validatePhone(phone)) {
      setError(
        t("auth.login.phoneInvalid", "Please enter a valid phone number.")
      );
      return;
    }

    try {
      const contact = `${selectedCountry.code}${phone.replace(/\s+/g, "")}`;
      const response = await login(contact);
      
      if (response.success) {
        // Store login attempt for OTP verification
        localStorage.setItem(
          "loginAttempt",
          JSON.stringify({
            type: "phone",
            contact,
            requestId: response.requestId || "request_" + Date.now(),
          })
        );
        
        toast.success(t("auth.login.otpSent", "OTP sent successfully"));
        navigate("/otp");
      } else {
        setError(response.message || t("auth.login.failed", "Login failed"));
      }
    } catch (error) {
      const errorMessage = error.message || t("auth.login.failed", "Login failed");
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-temple flex flex-col justify-center items-center">
      
      <motion.div
        className="text-center p-6 pt-16"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img src="/logo.png" alt="logo" className="w-48 h-48 mx-auto" />
        <p className="text-muted-foreground text-lg pt-4">
          {t("auth.login.subtitle", "Enter your mobile number to continue")}
        </p>
      </motion.div>

      <div className="flex-1 w-full px-2 relative z-10">
        <motion.div
          className="card-sacred mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Input with Country Picker */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("auth.login.phone", "Mobile number")}
              </label>

              <div className="flex flex-col gap-2">
                {/* Country Picker */}
                <div className="relative " ref={pickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowCountryPicker(!showCountryPicker)}
                    className="bg-white flex items-center justify-between w-full px-3 py-2 border border-input rounded-lg bg-background hover:bg-muted/50 transition-colors"
                    aria-label="Select country code"
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="text-sm font-medium">
                        {selectedCountry.code}
                      </span>
                    </span>
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {showCountryPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10"
                    >
                      {countryCodes.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowCountryPicker(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          <span className="text-lg">{country.flag}</span>
                          <span className="text-sm font-medium w-12">
                            {country.code}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {country.country}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Phone Input */}
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="input-divine flex-1 relative"
                  required
                />
              </div>

              {(error || authError) && (
                <p className="mt-2 text-sm text-red-500">{error || authError}</p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading || !validatePhone(phone)}
              className="btn-divine w-full flex items-center justify-center gap-2 text-lg py-4 disabled:opacity-50"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {t("auth.login.continue", "Continue")}
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        className="text-center pb-8 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <p className="text-sm text-muted-foreground">
          {t(
            "auth.login.agreement",
            "By continuing, you agree to our Terms of Service and Privacy Policy"
          )}
        </p>
      </motion.div>
      <DivineBackground />

    </div>
  );
}
