import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const InnerPageWrapper = ({ 
  title, 
  onBackClick, 
  rightContent, 
  children, 
  showBackButton = true 
}) => {
  return (
    <div className="min-h-screen bg-gradient-temple">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border/50 shadow-sm"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between h-16 px-4 safe-area-top">
          {/* Left - Back Button */}
          <div className="flex items-center">
            {showBackButton && (
              <motion.button
                onClick={onBackClick}
                className="p-2 hover:bg-muted rounded-full transition-colors mr-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft size={20} className="text-foreground" />
              </motion.button>
            )}
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
          </div>

          {/* Right Content */}
          <div className="flex items-center">
            {rightContent}
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <motion.main
        className="flex-1 pb-10" // Bottom padding for tab bar
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default InnerPageWrapper;