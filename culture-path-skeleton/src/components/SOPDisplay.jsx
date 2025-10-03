import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Info, Flower, User } from 'lucide-react';

const SOPDisplay = ({ booking, type = 'puja' }) => {
  const getPujaSOPs = () => [
    {
      phase: 'Before Puja (24 hours prior)',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      steps: [
        'Fast or consume only vegetarian food',
        'Take a holy bath and wear clean clothes',
        'Prepare mentally through meditation or prayer',
        'Gather any personal items for blessing (optional)'
      ]
    },
    {
      phase: 'On Puja Day (Morning)',
      icon: Flower,
      color: 'text-primary',
      bgColor: 'bg-primary/5',
      steps: [
        'Wake up early and take a purifying bath',
        'Wear traditional/clean clothes (preferably yellow or white)',
        'Carry your booking confirmation and ID',
        'Arrive at temple 30 minutes before scheduled time',
        'Maintain silence and peaceful mindset'
      ]
    },
    {
      phase: 'During Puja Ceremony',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      steps: [
        'Follow the priest\'s instructions respectfully',
        'Participate in chants and mantras',
        'Offer prayers for your intentions',
        'Maintain focused attention throughout the ceremony',
        'Accept prasadam with gratitude'
      ]
    },
    {
      phase: 'After Puja Completion',
      icon: User,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      steps: [
        'Receive blessed prasadam and sacred ash',
        'Take blessings from the priest',
        'Spend time in silent gratitude',
        'Share prasadam with family members',
        'Maintain the spiritual energy gained'
      ]
    }
  ];

  const getTempleSOPs = () => [
    {
      phase: 'Before Temple Visit',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      steps: [
        'Check temple timings and special events',
        'Dress appropriately (traditional wear preferred)',
        'Remove leather items (belts, shoes, bags)',
        'Keep mobile phones on silent mode'
      ]
    },
    {
      phase: 'At Temple Entry',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      steps: [
        'Show your e-ticket and ID at entrance',
        'Remove footwear at designated area',
        'Wash hands and feet at provided facilities',
        'Follow security guidelines and queue system'
      ]
    },
    {
      phase: 'Inside Temple Premises',
      icon: Flower,
      color: 'text-primary',
      bgColor: 'bg-primary/5',
      steps: [
        'Maintain silence and reverent behavior',
        'Follow the darshan queue patiently',
        'Do not touch the deity or sacred items',
        'Photography restrictions apply in sanctum',
        'Collect prasadam after darshan'
      ]
    }
  ];

  const sops = type === 'puja' ? getPujaSOPs() : getTempleSOPs();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-6 border border-border"
    >
      <div className="flex items-center mb-6">
        <div className="bg-primary/10 p-3 rounded-full mr-3">
          <Info size={24} className="text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {type === 'puja' ? 'Puja Ceremony' : 'Temple Visit'} Guidelines
          </h3>
          <p className="text-muted-foreground">
            Standard Operating Procedures for a blessed experience
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {sops.map((sop, index) => {
          const IconComponent = sop.icon;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex items-start mb-4">
                <div className={`${sop.bgColor} p-2 rounded-full mr-4 flex-shrink-0`}>
                  <IconComponent size={20} className={sop.color} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-lg mb-2">
                    {sop.phase}
                  </h4>
                  <div className="space-y-2">
                    {sop.steps.map((step, stepIndex) => (
                      <motion.div
                        key={stepIndex}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + stepIndex * 0.05 }}
                        className="flex items-start"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0" />
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {step}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Connection line to next phase */}
              {index < sops.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-6 bg-border" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Important Note */}
      <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
        <div className="flex items-start">
          <AlertCircle size={20} className="text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-semibold text-amber-800 mb-1">Important Note</h5>
            <p className="text-amber-700 text-sm">
              Please follow all guidelines respectfully. These procedures ensure a peaceful 
              and spiritually enriching experience for all devotees. 
              {type === 'puja' 
                ? 'The puja ceremony is a sacred ritual that requires your sincere participation.'
                : 'Temple visits are meant for spiritual connection and inner peace.'
              }
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SOPDisplay;