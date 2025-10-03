import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, QrCode, User, Phone, Mail, Navigation } from 'lucide-react';
import QRCode from 'qrcode';
import { useState, useEffect } from 'react';

const TempleETicket = ({ booking }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrData = `TEMPLE-TICKET-${booking.id}-${booking.templeId}-${booking.serviceType}`;
        const url = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [booking]);

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-6 text-primary-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">🕉️ Divine Temple</h2>
          <p className="text-primary-foreground/90">Electronic Darshan Ticket</p>
          <div className="bg-primary-foreground/20 rounded-full px-4 py-1 inline-block mt-2">
            <p className="text-sm font-medium">CONFIRMED</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Ticket Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">{booking.serviceName}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar size={16} className="text-primary mr-3" />
                <div>
                  <p className="font-semibold text-foreground">{formatDate(booking.visitDate)}</p>
                  <p className="text-sm text-muted-foreground">Visit Date</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock size={16} className="text-primary mr-3" />
                <div>
                  <p className="font-semibold text-foreground">{formatTime(booking.visitDate)}</p>
                  <p className="text-sm text-muted-foreground">Time Slot</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin size={16} className="text-primary mr-3" />
                <div>
                  <p className="font-semibold text-foreground">{booking.templeName}</p>
                  <p className="text-sm text-muted-foreground">Temple Location</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-2xl border-2 border-primary/20">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
              ) : (
                <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                  <QrCode size={48} className="text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Scan at temple entrance
            </p>
          </div>
        </div>

        {/* Booking Information */}
        <div className="bg-muted/50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Booking ID</p>
              <p className="font-mono font-semibold text-foreground">
                #{booking.id.toString().slice(-8).toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className="text-xl font-bold text-primary">₹{booking.amount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment ID</p>
              <p className="font-mono text-sm text-foreground">
                {booking.paymentId?.slice(-12) || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                {booking.status}
              </span>
            </div>
          </div>
        </div>

        {/* Temple Information */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 mb-6">
          <h4 className="font-semibold text-foreground mb-3 flex items-center">
            <Navigation size={16} className="mr-2 text-primary" />
            Temple Visit Information
          </h4>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              • Temple opens at 5:00 AM and closes at 9:00 PM
            </p>
            <p className="text-muted-foreground">
              • Please arrive 15 minutes before your scheduled time
            </p>
            <p className="text-muted-foreground">
              • Carry this e-ticket and a valid ID for entry
            </p>
            <p className="text-muted-foreground">
              • Follow temple dress code and guidelines
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t border-border pt-4">
          <h4 className="font-semibold text-foreground mb-3">Temple Contact</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <Phone size={14} className="text-primary mr-2" />
              <span className="text-muted-foreground">+91 98765 43210</span>
            </div>
            <div className="flex items-center">
              <Mail size={14} className="text-primary mr-2" />
              <span className="text-muted-foreground">darshan@divinetemple.org</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            This is a digital ticket. Please show this at the temple entrance.
            <br />
            May the divine bless your visit with peace and prosperity.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default TempleETicket;