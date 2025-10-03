import { motion } from 'framer-motion';
import { Check, Clock, Calendar, Users, Gift } from 'lucide-react';

const BookingTimeline = ({ booking, currentStep = 1 }) => {
  const getSteps = () => {
    if (booking.type === 'puja') {
      return [
        { 
          id: 1, 
          title: 'Booking Confirmed', 
          description: 'Your puja booking has been confirmed',
          icon: Check,
          completed: true 
        },
        { 
          id: 2, 
          title: 'Payment Successful', 
          description: `Payment of ₹${booking.amount} completed`,
          icon: Gift,
          completed: true 
        },
        { 
          id: 3, 
          title: 'Preparation Phase', 
          description: 'Temple preparations in progress',
          icon: Clock,
          completed: currentStep >= 3 
        },
        { 
          id: 4, 
          title: 'Puja Ceremony', 
          description: 'Scheduled puja ceremony',
          icon: Calendar,
          completed: currentStep >= 4 
        }
      ];
    } else {
      return [
        { 
          id: 1, 
          title: 'Booking Confirmed', 
          description: 'Your temple visit is confirmed',
          icon: Check,
          completed: true 
        },
        { 
          id: 2, 
          title: 'Payment Complete', 
          description: `Amount ₹${booking.amount} paid`,
          icon: Gift,
          completed: true 
        },
        { 
          id: 3, 
          title: 'Visit Scheduled', 
          description: 'Ready for temple visit',
          icon: Calendar,
          completed: currentStep >= 3 
        }
      ];
    }
  };

  const steps = getSteps();

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <h3 className="font-semibold text-foreground mb-4 flex items-center">
        <Clock size={18} className="mr-2 text-primary" />
        Booking Timeline
      </h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="flex items-start">
              {/* Timeline Line */}
              <div className="flex flex-col items-center mr-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    step.completed
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-muted border-muted-foreground text-muted-foreground'
                  }`}
                >
                  <IconComponent size={16} />
                </motion.div>
                {!isLast && (
                  <div 
                    className={`w-0.5 h-8 mt-2 ${
                      step.completed ? 'bg-primary' : 'bg-muted'
                    }`} 
                  />
                )}
              </div>
              
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.1 }}
                className="flex-1 pb-4"
              >
                <h4 className={`font-medium ${
                  step.completed ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </h4>
                <p className={`text-sm ${
                  step.completed ? 'text-muted-foreground' : 'text-muted-foreground/70'
                }`}>
                  {step.description}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingTimeline;