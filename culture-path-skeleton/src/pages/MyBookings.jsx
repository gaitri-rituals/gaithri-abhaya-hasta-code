import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Eye, MapPin, Users, Gift, QrCode, Info } from 'lucide-react';
import { bookingAPI } from '../services/api';
import InnerPageWrapper from '../components/InnerPageWrapper';
import BookingTimeline from '../components/BookingTimeline';
import PujaDetailsCard from '../components/PujaDetailsCard';
import TempleETicket from '../components/TempleETicket';
import SOPDisplay from '../components/SOPDisplay';

const MyBookings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingAPI.getAll();
        setBookings(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filterBookings = (bookings, type) => {
    const now = new Date();
    return bookings.filter(booking => {
      const visitDate = new Date(booking.visitDate);
      if (type === 'upcoming') {
        return visitDate >= now;
      } else {
        return visitDate < now;
      }
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'donation':
        return <Gift size={16} className="text-green-600" />;
      case 'archana':
        return <Users size={16} className="text-blue-600" />;
      case 'abhisheka':
        return <Calendar size={16} className="text-purple-600" />;
      default:
        return <Calendar size={16} className="text-gray-600" />;
    }
  };

  const handleViewDetails = async (booking) => {
    try {
      setLoading(true);
      const bookingDetails = await bookingAPI.getById(booking.id);
      setSelectedBooking(bookingDetails);
      setShowDetails(true);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleShowQR = async (booking) => {
    try {
      setLoading(true);
      const [bookingDetails, qrCode] = await Promise.all([
        bookingAPI.getById(booking.id),
        bookingAPI.getQRCode(booking.id)
      ]);
      setSelectedBooking({ ...bookingDetails, qrCode });
      setShowDetails(true);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch booking QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedBooking(null);
    setShowDetails(false);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const upcomingBookings = filterBookings(bookings, 'upcoming');
  const pastBookings = filterBookings(bookings, 'past');

  if (loading && !showDetails) {
    return (
      <InnerPageWrapper title="My Bookings" onBackClick={handleBackClick}>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </InnerPageWrapper>
    );
  }

  if (error && !showDetails) {
    return (
      <InnerPageWrapper title="My Bookings" onBackClick={handleBackClick}>
        <div className="flex flex-col items-center justify-center h-[60vh] p-4">
          <p className="text-red-500 text-center mb-4">{error}</p>
          <motion.button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Try Again
          </motion.button>
        </div>
      </InnerPageWrapper>
    );
  }

  // Modal/Detail View
  if (showDetails && selectedBooking) {
    return (
      <InnerPageWrapper
        title={selectedBooking.type === 'puja' ? 'Puja Booking Details' : 'Temple Visit Details'}
        onBackClick={handleCloseDetails}
      >
        <div className="p-4 pb-20 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : selectedBooking.type === 'puja' ? (
            <>
              <PujaDetailsCard booking={selectedBooking} />
              <BookingTimeline booking={selectedBooking} currentStep={2} />
              <SOPDisplay booking={selectedBooking} type="puja" />
            </>
          ) : (
            <>
              <TempleETicket booking={selectedBooking} />
              <BookingTimeline booking={selectedBooking} currentStep={3} />
              <SOPDisplay booking={selectedBooking} type="temple" />
            </>
          )}
        </div>
      </InnerPageWrapper>
    );
  }

  return (
    <InnerPageWrapper
      title="My Bookings"
      onBackClick={handleBackClick}
    >
      <div className="pb-20">
        {/* Tabs */}
        <div className="flex bg-muted mx-4 mt-4 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'past'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Past ({pastBookings.length})
          </button>
        </div>

        <div className="p-4">
          {/* Bookings List */}
          <div className="space-y-4">
            {(activeTab === 'upcoming' ? upcomingBookings : pastBookings).length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-muted rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Calendar size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No {activeTab} bookings
                </h3>
                <p className="text-muted-foreground text-center mb-6">
                  {activeTab === 'upcoming' 
                    ? "You don't have any upcoming temple visits"
                    : "You haven't visited any temples yet"
                  }
                </p>
                <motion.button
                  onClick={() => navigate('/explore-temples')}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Explore Temples
                </motion.button>
              </div>
            ) : (
              (activeTab === 'upcoming' ? upcomingBookings : pastBookings).map((booking) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
                >
                  {/* Header */}
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {getServiceIcon(booking.serviceType)}
                          <h3 className="font-semibold text-foreground ml-2">{booking.serviceName}</h3>
                        </div>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <MapPin size={14} className="mr-1" />
                          <span>{booking.templeName}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-lg">₹{booking.amount}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: #{booking.id.toString().slice(-6)}
                        </p>
                      </div>
                    </div>

                    {/* Visit Date & Time */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar size={14} className="mr-1" />
                        <span>{formatDate(booking.visitDate)}</span>
                        <Clock size={14} className="ml-3 mr-1" />
                        <span>{formatTime(booking.visitDate)}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  {/* Devotee Details */}
                  {booking.devotees && booking.devotees.length > 0 && (
                    <div className="px-4 pb-3">
                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                        <Users size={14} className="mr-1" />
                        Devotees ({booking.devotees.length})
                      </h4>
                      <div className="space-y-1">
                        {booking.devotees.slice(0, 3).map((devotee, index) => (
                          <div key={devotee.id} className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            {index + 1}. {devotee.name}
                            {devotee.nakshatra && ` - ${devotee.nakshatra}`}
                          </div>
                        ))}
                        {booking.devotees.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center py-1">
                            +{booking.devotees.length - 3} more devotees
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-4 pb-4">
                    <motion.button
                      onClick={() => booking.type === 'puja' ? handleViewDetails(booking) : handleShowQR(booking)}
                      className="w-full bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border border-primary/20 py-3 rounded-xl font-medium flex items-center justify-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {booking.type === 'puja' ? (
                        <>
                          <Info size={18} className="mr-2" />
                          View Full Details
                        </>
                      ) : (
                        <>
                          <QrCode size={18} className="mr-2" />
                          Show E-Ticket
                        </>
                      )}
                    </motion.button>
                  </div>

                  {/* Booking Footer */}
                  <div className="px-4 py-2 bg-muted/30 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Booked on {formatDate(booking.bookedAt)} • Payment ID: {booking.paymentId?.slice(-8)}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </InnerPageWrapper>
  );
};

export default MyBookings;