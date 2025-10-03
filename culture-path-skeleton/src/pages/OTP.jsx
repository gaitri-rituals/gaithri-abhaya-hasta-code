import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowLeft, RotateCcw, Shield, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../state/store";
import DivineBackground from "../components/ui/divineBackground";

const OTP = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { verifyOTP, login, isLoading, authError, clearAuthError } = useAppStore();
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const timeoutRef = useRef(null);
  const [loginAttempt, setLoginAttempt] = useState(null);

  useEffect(() => {
    // Get login attempt data
    const stored = localStorage.getItem('loginAttempt');
    if (stored) {
      setLoginAttempt(JSON.parse(stored));
    } else {
      // If no login attempt found, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    // Countdown timer for resend
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    clearAuthError();

    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setError(t('auth.otp.invalid', 'Please enter a valid 4-digit OTP.'));
      return;
    }

    if (!loginAttempt?.contact) {
      setError(t('auth.otp.sessionExpired', 'Session expired. Please login again.'));
      navigate('/login');
      return;
    }

    try {
      const response = await verifyOTP(loginAttempt.contact, otpValue, loginAttempt.requestId);
      
      if (response.success) {
        toast.success(t('auth.otp.success', 'Login successful'));
        // Clear login attempt from localStorage
        localStorage.removeItem('loginAttempt');
        // Redirect to address selection page
        navigate('/address');
      } else {
        setError(response.message || t('auth.otp.incorrect', 'Incorrect OTP. Please try again.'));
      }
    } catch (error) {
      const errorMessage = error.message || t('auth.otp.failed', 'OTP verification failed');
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleResend = async () => {
    if (!canResend || !loginAttempt) return;

    setResendCountdown(30);
    setCanResend(false);
    setError('');
    setOtp(['', '', '', '']);
    clearAuthError();

    try {
      const response = await login(loginAttempt.contact);
      
      if (response.success) {
        // Update login attempt with new request ID
        const updatedAttempt = {
          ...loginAttempt,
          requestId: response.requestId || "request_" + Date.now(),
        };
        localStorage.setItem("loginAttempt", JSON.stringify(updatedAttempt));
        setLoginAttempt(updatedAttempt);
        
        toast.success(t("auth.otp.resent", "OTP resent successfully"));
      } else {
        setError(response.message || t("auth.otp.resendFailed", "Failed to resend OTP"));
      }
    } catch (error) {
      const errorMessage = error.message || t("auth.otp.resendFailed", "Failed to resend OTP");
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleBack = () => {
    navigate('/login');
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <div className="min-h-screen bg-gradient-temple flex flex-col">
      
      {/* Header */}
      <motion.div 
        className="flex items-center gap-4 p-6 relative z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={handleBack}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">
          {t('auth.otp.title')}
        </h1>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 px-6 relative z-10">
        <motion.div
          className="card-sacred max-w-md mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Icon */}
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-divine 
                       flex items-center justify-center shadow-divine"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.3, type: "spring" }}
          >
            <Shield size={32} className="text-white" />
          </motion.div>

          {/* Title and Description */}
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t('auth.otp.title')}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t('auth.otp.subtitle')}
            <br />
            <span className="font-medium text-primary">
              {loginAttempt?.contact}
            </span>
          </p>

          {/* OTP Input Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Inputs */}
            <div className="flex justify-center gap-3 mb-6">
              {otp.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold input-divine"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 0.4 }}
                />
              ))}
            </div>

            {/* Verify Button */}
            {(error || authError) && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm text-center"
              >
                {error || authError}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={isLoading || !isOtpComplete}
              className="btn-divine w-full flex items-center justify-center gap-2 text-lg py-4 disabled:opacity-50"
              whileHover={{ scale: isLoading || !isOtpComplete ? 1 : 1.02 }}
              whileTap={{ scale: isLoading || !isOtpComplete ? 1 : 0.98 }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth.otp.verify')}
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 pt-4 border-t border-border">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 transition-colors mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={16} />
                {t('auth.otp.resend')}
              </button>
            ) : (
              <p className="text-muted-foreground text-sm">
                Resend code in {resendCountdown}s
              </p>
            )}
          </div>
        </motion.div>
      </div>
      <DivineBackground />
    </div>
  );
};

export default OTP;