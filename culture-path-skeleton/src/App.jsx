import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "./state/store";
import { initI18n } from "./i18n/i18n";

// Components
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import OTP from "./pages/OTP";
import Home from "./pages/Home";
import AddressSelection from "./pages/AddressSelection";
import Classes from "./pages/Classes";
import Store from "./pages/Store";
import Community from "./pages/Community";
import Events from "./pages/Events";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AuthWrapper from "./components/AuthWrapper";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import ScrollToTop from "./components/ScrollToTop";
import { Toaster } from 'sonner';
import ExploreTemples from "./pages/ExploreTemples";
import TempleDetails from "./pages/TempleDetails";
import Basket from "./pages/Basket";
import Checkout from "./pages/Checkout";
import MyBookings from "./pages/MyBookings";
import BookingDetails from "./pages/BookingDetails";
import QRTicket from "./pages/QRTicket";
import PujaBooking from "./pages/PujaBooking";
import PujaBookingDetails from "./pages/PujaBookingDetails";
import BookingSuccess from "./pages/BookingSuccess";
import ClassEnrollmentStepper from "./pages/ClassEnrollmentStepper";
import MySubscriptions from "./pages/MySubscriptions";

// Initialize i18n
initI18n();

const App = () => {
  const { isOnboardingCompleted, initializeApp } = useAppStore();

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return (
    <div className="min-h-screen bg-gradient-temple">
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          {!isOnboardingCompleted && (
            <Route path="/*" element={<Onboarding />} />
          )}
          {isOnboardingCompleted && (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/otp" element={<OTP />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <AuthWrapper>
                  <Home />
                </AuthWrapper>
              } />
              <Route path="/address" element={
                <AuthWrapper>
                  <AddressSelection />
                </AuthWrapper>
              } />
              <Route path="/classes" element={
                <AuthWrapper>
                  <Classes />
                </AuthWrapper>
              } />
              <Route path="/store" element={
                <AuthWrapper>
                  <Store />
                </AuthWrapper>
              } />
              <Route path="/community" element={
                <AuthWrapper>
                  <Community />
                </AuthWrapper>
              } />
              <Route path="/events" element={
                <AuthWrapper>
                  <Events />
                </AuthWrapper>
              } />
              <Route path="/profile" element={
                <AuthWrapper>
                  <Profile />
                </AuthWrapper>
              } />
              
              {/* Temple Routes */}
              <Route path="/explore-temples" element={
                <AuthWrapper>
                  <ExploreTemples />
                </AuthWrapper>
              } />
              <Route path="/temple/:id" element={
                <AuthWrapper>
                  <TempleDetails />
                </AuthWrapper>
              } />
              <Route path="/basket" element={
                <AuthWrapper>
                  <Basket />
                </AuthWrapper>
              } />
              <Route path="/checkout" element={
                <AuthWrapper>
                  <Checkout />
                </AuthWrapper>
              } />
              <Route path="/my-bookings" element={
                <AuthWrapper>
                  <MyBookings />
                </AuthWrapper>
              } />
              <Route path="/booking-details" element={
                <AuthWrapper>
                  <BookingDetails />
                </AuthWrapper>
              } />
              <Route path="/qr-ticket" element={
                <AuthWrapper>
                  <QRTicket />
                </AuthWrapper>
              } />
              
              {/* Puja Booking Routes */}
              <Route path="/puja-booking" element={
                <AuthWrapper>
                  <PujaBooking />
                </AuthWrapper>
              } />
              <Route path="/puja-booking-details" element={
                <AuthWrapper>
                  <PujaBookingDetails />
                </AuthWrapper>
              } />
              <Route path="/booking-success" element={
                <AuthWrapper>
                  <BookingSuccess />
                </AuthWrapper>
              } />

              <Route path="/class-enrollment/:classId/step/:step" element={
  <AuthWrapper>
    <ClassEnrollmentStepper />
  </AuthWrapper>
} />
              
              <Route path="/my-subscriptions" element={
                <AuthWrapper>
                  <MySubscriptions />
                </AuthWrapper>
              } />
              
              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
      <PWAInstallPrompt appName="gaitri"/>
      <Toaster position="top-center" richColors />
    </div>
  );
};

export default App;