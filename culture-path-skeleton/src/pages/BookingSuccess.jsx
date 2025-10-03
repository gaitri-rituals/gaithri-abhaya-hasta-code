import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Calendar, MapPin, Clock, Users, Gift, QrCode } from 'lucide-react';
import { bookingAPI } from '../services/api';
import InnerPageWrapper from '../components/InnerPageWrapper';
import BookingTimeline from '../components/BookingTimeline';
import PujaDetailsCard from '../components/PujaDetailsCard';
import TempleETicket from '../components/TempleETicket';
import SOPDisplay from '../components/SOPDisplay';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId, type } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const data = type === 'puja' 
          ? await bookingAPI.puja.getPujaBooking(bookingId)
          : await bookingAPI.temple.getTempleBooking(bookingId);
        setBooking(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch booking details');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    } else {
      navigate('/');
    }
  }, [bookingId, type, navigate]);

  const handleViewBookings = () => {
    navigate('/my-bookings');
  };

  const handleExploreMore = () => {
    navigate('/explore-temples');
  };

  if (loading) {
    return (
      <InnerPageWrapper title="Booking Confirmed">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </InnerPageWrapper>
    );
  }

  if (error) {
    return (
      <InnerPageWrapper title="Booking Error">
        <div className="flex flex-col items-center justify-center h-[60vh] p-4">
          <p className="text-red-500 text-center mb-4">{error}</p>
          <motion.button
            onClick={handleViewBookings}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View My Bookings
          </motion.button>
        </div>
      </InnerPageWrapper>
    );
  }

  return (
    <InnerPageWrapper title="Booking Confirmed">
      <div className="p-4 pb-20">
        {/* Success Animation */}
        <div className="flex flex-col items-center justify-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
          >
            <Check className="w-10 h-10 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {type === 'puja' ? 'Puja Booking Confirmed!' : 'Temple Visit Confirmed!'}
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            Your booking has been confirmed and payment has been received
          </p>
        </div>

        {/* Booking Details */}
        {booking && (
          <div className="space-y-6">
            {type === 'puja' ? (
              <>
                <PujaDetailsCard booking={booking} />
                <BookingTimeline booking={booking} currentStep={2} />
                <SOPDisplay booking={booking} type="puja" />
              </>
            ) : (
              <>
                <TempleETicket booking={booking} />
                <BookingTimeline booking={booking} currentStep={2} />
                <SOPDisplay booking={booking} type="temple" />
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <motion.button
              onClick={handleViewBookings}
              className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View My Bookings
            </motion.button>
            <motion.button
              onClick={handleExploreMore}
              className="flex-1 bg-muted text-muted-foreground px-6 py-3 rounded-lg font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Explore More
            </motion.button>
          </div>
        </div>
      </div>
    </InnerPageWrapper>
  );
};

export default BookingSuccess;