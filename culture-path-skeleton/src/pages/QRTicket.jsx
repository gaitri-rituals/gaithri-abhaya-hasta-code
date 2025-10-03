import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  QrCode, 
  Download, 
  Share2, 
  Calendar, 
  Clock, 
  MapPin,
  FileText
} from 'lucide-react';
import InnerPageWrapper from '../components/InnerPageWrapper';
import { generateTicketQR } from '../utils/localStorage';

const QRTicket = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking } = location.state || {};

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

  const handleDownloadEBill = () => {
    // In a real app, this would generate and download a PDF e-bill
    alert('Downloading E-Bill...');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Temple Booking - ${booking.serviceName}`,
        text: `My temple booking at ${booking.templeName} on ${formatDate(booking.visitDate)}`,
        url: window.location.href
      });
    } else {
      alert('Sharing not supported on this device');
    }
  };

  const qrData = generateTicketQR(booking);

  return (
    <InnerPageWrapper
      title="QR Ticket"
      onBackClick={() => navigate('/my-bookings')}
    >
      <div className="pb-20">
        {/* Booking Summary */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 mx-4 mt-4 rounded-2xl p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">{booking.serviceName}</h2>
            <div className="flex items-center justify-center text-muted-foreground">
              <MapPin size={16} className="mr-1" />
              <span>{booking.templeName}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-card/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center text-muted-foreground text-sm mb-1">
                <Calendar size={14} className="mr-1" />
                Date
              </div>
              <p className="font-semibold text-foreground text-sm">{formatDate(booking.visitDate)}</p>
            </div>
            <div className="bg-card/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center text-muted-foreground text-sm mb-1">
                <Clock size={14} className="mr-1" />
                Time
              </div>
              <p className="font-semibold text-foreground text-sm">{formatTime(booking.visitDate)}</p>
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-primary">₹{booking.amount}</p>
            <p className="text-xs text-muted-foreground">Booking ID: #{booking.id.toString().slice(-6)}</p>
          </div>
        </div>

        {/* QR Code Display */}
        <div className="mx-4 mt-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-4">Scan QR Code at Temple</h3>
              
              {/* QR Code Placeholder */}
              <div className="bg-muted border-2 border-dashed border-border rounded-lg p-8 mb-6">
                <div className="w-48 h-48 bg-foreground mx-auto rounded-lg flex items-center justify-center">
                  <QrCode size={120} className="text-background" />
                </div>
                <p className="text-xs text-muted-foreground mt-4 font-mono break-all px-4">
                  {qrData}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  📱 Show this QR code to temple authorities for quick entry and service verification.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="p-4">
          <div className="space-y-3">
            <motion.button
              onClick={handleDownloadEBill}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FileText size={18} className="mr-2" />
              Download E-Bill
            </motion.button>
            
            <div className="flex gap-3">
              <motion.button
                onClick={() => window.print()}
                className="flex-1 bg-card border border-border py-3 px-4 rounded-lg font-medium flex items-center justify-center text-foreground"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download size={16} className="mr-2" />
                Print
              </motion.button>
              
              <motion.button
                onClick={handleShare}
                className="flex-1 bg-card border border-border py-3 px-4 rounded-lg font-medium flex items-center justify-center text-foreground"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Share2 size={16} className="mr-2" />
                Share
              </motion.button>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mx-4 mt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Important Instructions</h4>
            <ul className="text-yellow-800 text-sm space-y-1">
              <li>• Arrive 15 minutes before your scheduled time</li>
              <li>• Ensure your phone has sufficient battery</li>
              <li>• Follow temple dress code and guidelines</li>
              <li>• Keep this QR code ready for scanning</li>
            </ul>
          </div>
        </div>
      </div>
    </InnerPageWrapper>
  );
};

export default QRTicket;