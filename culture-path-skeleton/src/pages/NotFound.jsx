import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, MapPin } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-temple flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        {/* 404 Icon */}
        <motion.div
          className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-divine 
                     flex items-center justify-center shadow-divine"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
        >
          <MapPin size={48} className="text-white" />
        </motion.div>

        {/* Error Message */}
        <motion.h1
          className="text-6xl font-bold text-gradient-divine mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          404
        </motion.h1>

        <motion.h2
          className="text-2xl font-bold text-foreground mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Sacred Path Not Found
        </motion.h2>

        <motion.p
          className="text-muted-foreground mb-8 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          The divine path you're seeking doesn't exist in our temple. 
          Let us guide you back to the sacred grounds.
        </motion.p>

        {/* Current Route Info */}
        <motion.div
          className="bg-muted/50 rounded-lg p-4 mb-8 text-left"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Search size={14} />
            Attempted Path:
          </div>
          <code className="text-sm font-mono text-foreground break-all">
            {location.pathname}
          </code>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Link
            to="/"
            className="btn-divine flex items-center justify-center gap-2 py-3 px-6"
          >
            <Home size={20} />
            Return to Temple
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn-temple flex items-center justify-center gap-2 py-3 px-6"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          className="mt-8 pt-6 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Popular Sacred Destinations:
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              to="/"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Home
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              to="/login"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Login
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              to="/address"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Address
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full"
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-32 right-16 w-24 h-24 bg-secondary/5 rounded-full"
          animate={{
            y: [0, 20, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>
    </div>
  );
};

export default NotFound;