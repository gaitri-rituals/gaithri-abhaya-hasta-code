import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Gift, Flower, OmegaIcon } from 'lucide-react';

const PujaDetailsCard = ({ booking }) => {
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

  const getPujaType = (serviceType) => {
    const pujaTypes = {
      'archana': 'Archana Seva',
      'abhisheka': 'Abhisheka Ritual',
      'donation': 'Special Donation',
      'pooja': 'Special Pooja'
    };
    return pujaTypes[serviceType] || serviceType;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 border border-primary/20"
    >
      <div className="flex items-center mb-4">
        <div className="bg-primary/10 p-3 rounded-full mr-3">
          <OmegaIcon size={24} className="text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">{booking.serviceName}</h3>
          <p className="text-primary font-medium">{getPujaType(booking.serviceType)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Date & Time */}
        <div className="bg-card/50 rounded-xl p-4">
          <div className="flex items-center mb-2">
            <Calendar size={16} className="text-primary mr-2" />
            <span className="text-sm font-medium text-foreground">Date & Time</span>
          </div>
          <p className="text-foreground font-semibold">{formatDate(booking.visitDate)}</p>
          <p className="text-muted-foreground text-sm flex items-center mt-1">
            <Clock size={14} className="mr-1" />
            {formatTime(booking.visitDate)}
          </p>
        </div>

        {/* Temple Location */}
        <div className="bg-card/50 rounded-xl p-4">
          <div className="flex items-center mb-2">
            <MapPin size={16} className="text-primary mr-2" />
            <span className="text-sm font-medium text-foreground">Temple</span>
          </div>
          <p className="text-foreground font-semibold">{booking.templeName}</p>
          <p className="text-muted-foreground text-sm">Sacred grounds</p>
        </div>

        {/* Offering Amount */}
        <div className="bg-card/50 rounded-xl p-4">
          <div className="flex items-center mb-2">
            <Gift size={16} className="text-primary mr-2" />
            <span className="text-sm font-medium text-foreground">Offering</span>
          </div>
          <p className="text-2xl font-bold text-primary">₹{booking.amount}</p>
          <p className="text-muted-foreground text-sm">Sacred contribution</p>
        </div>

        {/* Devotees */}
        <div className="bg-card/50 rounded-xl p-4">
          <div className="flex items-center mb-2">
            <Users size={16} className="text-primary mr-2" />
            <span className="text-sm font-medium text-foreground">Devotees</span>
          </div>
          <p className="text-foreground font-semibold">
            {booking.devotees?.length || 1} Person{booking.devotees?.length > 1 ? 's' : ''}
          </p>
          <p className="text-muted-foreground text-sm">Blessed souls</p>
        </div>
      </div>

      {/* Devotee Details */}
      {booking.devotees && booking.devotees.length > 0 && (
        <div className="bg-card/30 rounded-xl p-4 mb-4">
          <h4 className="font-semibold text-foreground mb-3 flex items-center">
            <Flower size={16} className="mr-2 text-primary" />
            Devotee Information
          </h4>
          <div className="space-y-3">
            {booking.devotees.map((devotee, index) => (
              <div key={devotee.id} className="bg-card/50 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{index + 1}. {devotee.name}</p>
                    {devotee.dob && (
                      <p className="text-sm text-muted-foreground">DOB: {devotee.dob}</p>
                    )}
                    {devotee.nakshatra && (
                      <p className="text-sm text-primary">Nakshatra: {devotee.nakshatra}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Reference */}
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <p className="text-sm text-muted-foreground">Booking Reference</p>
        <p className="font-mono text-lg font-semibold text-foreground">
          #{booking.id.toString().slice(-8).toUpperCase()}
        </p>
      </div>
    </motion.div>
  );
};

export default PujaDetailsCard;