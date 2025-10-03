import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Gift, 
  CheckCircle, 
  Circle,
  Phone,
  Mail,
  AlertCircle,
  QrCode,
  Download,
  Share2
} from 'lucide-react';
import InnerPageWrapper from '../components/InnerPageWrapper';

const BookingDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking } = location.state || {};
  const [activeTab, setActiveTab] = useState('timeline');

  if (!booking) {
    navigate('/my-bookings');
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
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
        return <Gift size={20} className="text-green-600" />;
      case 'archana':
        return <Users size={20} className="text-blue-600" />;
      case 'abhisheka':
        return <Calendar size={20} className="text-purple-600" />;
      default:
        return <Calendar size={20} className="text-gray-600" />;
    }
  };

  const timelineEvents = [
    {
      id: 1,
      title: 'Booking Confirmed',
      description: 'Your booking has been confirmed and payment received.',
      time: booking.bookedAt,
      status: 'completed',
      icon: CheckCircle
    },
    {
      id: 2,
      title: 'Temple Notification',
      description: 'Temple authorities have been notified about your visit.',
      time: booking.bookedAt,
      status: 'completed',
      icon: CheckCircle
    },
    {
      id: 3,
      title: 'Preparation Begins',
      description: 'Temple staff will begin preparations for your service.',
      time: new Date(new Date(booking.visitDate).getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours before
      status: new Date() > new Date(new Date(booking.visitDate).getTime() - 2 * 60 * 60 * 1000) ? 'completed' : 'upcoming',
      icon: new Date() > new Date(new Date(booking.visitDate).getTime() - 2 * 60 * 60 * 1000) ? CheckCircle : Circle
    },
    {
      id: 4,
      title: 'Service Time',
      description: 'Your scheduled puja/service will be performed.',
      time: booking.visitDate,
      status: new Date() > new Date(booking.visitDate) ? 'completed' : 'upcoming',
      icon: new Date() > new Date(booking.visitDate) ? CheckCircle : Circle
    }
  ];

  const sopSteps = [
    {
      id: 1,
      title: 'Arrival Instructions',
      description: 'Arrive at the temple 15 minutes before your scheduled time.',
      details: [
        'Report to the main reception desk',
        'Show your booking confirmation',
        'Follow temple dress code guidelines'
      ]
    },
    {
      id: 2,
      title: 'Check-in Process',
      description: 'Complete the check-in process at the temple.',
      details: [
        'Provide booking ID and devotee details',
        'Verify the service details',
        'Receive temple guidelines and instructions'
      ]
    },
    {
      id: 3,
      title: 'Service Preparation',
      description: 'Preparation time before the actual service begins.',
      details: [
        'Temple staff will guide you to the designated area',
        'Any special items or offerings will be arranged',
        'Brief explanation of the service procedure'
      ]
    },
    {
      id: 4,
      title: 'Service Execution',
      description: 'The actual puja/service will be performed.',
      details: [
        'Participate as guided by the temple priest',
        'Maintain temple decorum and silence',
        'Follow all rituals and traditions respectfully'
      ]
    },
    {
      id: 5,
      title: 'Completion',
      description: 'Service completion and blessing distribution.',
      details: [
        'Receive prasadam and blessings',
        'Any certificates or blessed items will be provided',
        'Thank the temple staff and priest'
      ]
    }
  ];

  const handleDownloadTicket = () => {
    // In a real app, this would generate and download a PDF ticket
    alert('Downloading ticket...');
  };

  const handleShare = () => {
    // In a real app, this would open share dialog
    if (navigator.share) {
      navigator.share({
        title: `My Temple Booking - ${booking.serviceName}`,
        text: `I have a booking at ${booking.templeName} on ${formatDate(booking.visitDate)}`,
        url: window.location.href
      });
    } else {
      alert('Sharing not supported on this device');
    }
  };

  return (
    <InnerPageWrapper
      title="Booking Details"
      onBackClick={() => navigate('/my-bookings')}
    >
      <div className="pb-20">
        {/* Booking Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 mx-4 mt-4 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              {getServiceIcon(booking.serviceType)}
              <div className="ml-3">
                <h2 className="text-xl font-bold text-foreground">{booking.serviceName}</h2>
                <div className="flex items-center text-muted-foreground mt-1">
                  <MapPin size={14} className="mr-1" />
                  <span className="text-sm">{booking.templeName}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary text-2xl">₹{booking.amount}</p>
              <p className="text-xs text-muted-foreground">ID: #{booking.id.toString().slice(-6)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-card/50 rounded-lg p-3">
              <div className="flex items-center text-muted-foreground text-sm mb-1">
                <Calendar size={14} className="mr-1" />
                Date
              </div>
              <p className="font-semibold text-foreground">{formatDate(booking.visitDate)}</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3">
              <div className="flex items-center text-muted-foreground text-sm mb-1">
                <Clock size={14} className="mr-1" />
                Time
              </div>
              <p className="font-semibold text-foreground">{formatTime(booking.visitDate)}</p>
            </div>
          </div>

          {booking.type === 'puja' ? (
            <div className="flex gap-2">
              <motion.button
                onClick={handleDownloadTicket}
                className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download size={16} className="mr-2" />
                Download E-Bill
              </motion.button>
              <motion.button
                onClick={handleShare}
                className="bg-card border border-border py-2 px-4 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Share2 size={16} />
              </motion.button>
            </div>
          ) : (
            <div className="flex gap-2">
              <motion.button
                onClick={handleDownloadTicket}
                className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <QrCode size={16} className="mr-2" />
                QR Ticket
              </motion.button>
              <motion.button
                onClick={handleDownloadTicket}
                className="bg-card border border-border py-2 px-4 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download size={16} />
              </motion.button>
              <motion.button
                onClick={handleShare}
                className="bg-card border border-border py-2 px-4 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Share2 size={16} />
              </motion.button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-muted mx-4 mt-6 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'timeline'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('sop')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'sop'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Guidelines
          </button>
        </div>

        <div className="p-4">
          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Booking Timeline</h3>
              
              {timelineEvents.map((event, index) => {
                const Icon = event.icon;
                return (
                  <div key={event.id} className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      event.status === 'completed' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon size={20} />
                    </div>
                    
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">{event.title}</h4>
                          <p className="text-muted-foreground text-sm mt-1">{event.description}</p>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          {formatDate(event.time)}<br />
                          {formatTime(event.time)}
                        </div>
                      </div>
                      
                      {index < timelineEvents.length - 1 && (
                        <div className={`w-px h-6 ml-5 mt-4 ${
                          event.status === 'completed' ? 'bg-green-200' : 'bg-muted'
                        }`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* SOP Tab */}
          {activeTab === 'sop' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle size={20} className="text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Important Guidelines</h4>
                    <p className="text-blue-800 text-sm mt-1">
                      Please follow these step-by-step instructions for a smooth temple visit experience.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-4">Standard Operating Procedure</h3>
              
              {sopSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">
                      {step.id}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-2">{step.title}</h4>
                      <p className="text-muted-foreground text-sm mb-3">{step.description}</p>
                      
                      <div className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-start text-sm">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 mt-2" />
                            <span className="text-muted-foreground">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Contact Information */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-foreground mb-3">Need Help?</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Phone size={16} className="text-green-600 mr-2" />
                    <span className="text-muted-foreground">Temple Contact: +91 98765 43210</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail size={16} className="text-blue-600 mr-2" />
                    <span className="text-muted-foreground">Support: support@divinetemple.com</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Devotee Details */}
          {booking.devotees && booking.devotees.length > 0 && (
            <div className="mt-6 bg-card border border-border rounded-lg p-4">
              <h4 className="font-semibold text-foreground mb-3 flex items-center">
                <Users size={16} className="mr-2" />
                Devotee Details ({booking.devotees.length})
              </h4>
              <div className="space-y-2">
                {booking.devotees.map((devotee, index) => (
                  <div key={devotee.id} className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-foreground">{index + 1}. {devotee.name}</p>
                        {devotee.nakshatra && (
                          <p className="text-sm text-muted-foreground">Nakshatra: {devotee.nakshatra}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </InnerPageWrapper>
  );
};

export default BookingDetails;