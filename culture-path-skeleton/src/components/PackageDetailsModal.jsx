import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, Users, Play, ChevronLeft, ChevronRight } from 'lucide-react';

const PackageDetailsModal = ({ 
  isOpen, 
  onClose, 
  packageData, 
  basePrice = 0, 
  onSelectPackage 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  if (!isOpen || !packageData) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === packageData.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? packageData.images.length - 1 : prev - 1
    );
  };

  const totalPrice = Math.round(basePrice * packageData.priceMultiplier);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{packageData.name}</h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-3xl font-bold text-primary">₹{totalPrice.toLocaleString()}</span>
                <div className="flex items-center text-muted-foreground">
                  <Clock size={16} className="mr-1" />
                  <span className="text-sm">{packageData.duration}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X size={24} className="text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-6">
            {/* Image Gallery */}
            <div className="relative">
              <div className="aspect-video bg-muted rounded-xl overflow-hidden relative">
                <img
                  src={packageData.images[currentImageIndex]}
                  alt={`${packageData.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Image Navigation */}
                {packageData.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                    
                    {/* Image Indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                      {packageData.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Video Play Button */}
                {packageData.videos && packageData.videos.length > 0 && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
                  >
                    <div className="bg-primary text-primary-foreground p-4 rounded-full group-hover:scale-110 transition-transform">
                      <Play size={24} fill="currentColor" />
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-muted-foreground leading-relaxed">
                {packageData.detailedDescription}
              </p>
            </div>

            {/* Inclusions */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">What's Included</h3>
              <div className="grid grid-cols-1 gap-2">
                {packageData.includes.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            {packageData.testimonials && packageData.testimonials.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">What Our Devotees Say</h3>
                <div className="space-y-3">
                  {packageData.testimonials.map((testimonial, index) => (
                    <div key={index} className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill="currentColor" />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm italic mb-2">
                        "{testimonial.text}"
                      </p>
                      <p className="text-foreground font-medium text-sm">
                        - {testimonial.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Price</p>
                <p className="text-2xl font-bold text-primary">₹{totalPrice.toLocaleString()}</p>
              </div>
              <motion.button
                onClick={() => {
                  onSelectPackage();
                  onClose();
                }}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Select This Package
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PackageDetailsModal;