import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  User, 
  Settings, 
  Bell, 
  Heart,
  Calendar,
  Store,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Crown,
  Gift,
  Shield,
  Download,
  BookOpen
} from 'lucide-react';
import { useAppStore } from '../state/store';

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logout, isDarkMode, toggleTheme } = useAppStore();

  const menuItems = [
    { icon: User, label: 'Profile', id: 'profile' },
    { icon: Heart, label: 'My Prayers', id: 'prayers' },
    { icon: Calendar, label: 'My Bookings', id: 'bookings' },
    { icon: BookOpen, label: 'My Subscriptions', id: 'subscriptions' },
    { icon: Gift, label: 'Donations', id: 'donations' },
    { icon: Crown, label: 'Premium', id: 'premium', premium: true },
    { icon: Store, label: 'Temple Store', id: 'store' },
    { icon: Bell, label: 'Notifications', id: 'notifications' },
    { icon: Settings, label: 'Settings', id: 'settings' },
    { icon: HelpCircle, label: 'Help & Support', id: 'help' },
  ];

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleMenuClick = (item) => {
    console.log('Menu clicked:', item.id);
    
    // Handle navigation based on menu item
    switch(item.id) {
      case 'bookings':
        window.location.href = '/my-bookings';
        break;
      case 'subscriptions':
        window.location.href = '/my-subscriptions';
        break;
      case 'profile':
        window.location.href = '/profile';
        break;
      case 'store':
        window.location.href = '/store';
        break;
      default:
        console.log(`Navigation for ${item.id} not implemented yet`);
    }
    
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-card z-50 shadow-xl overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-gradient-divine text-white p-6 pb-8">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold">Divine Temple</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{user?.name || 'Divine User'}</h3>
                  <p className="text-white/80 text-sm">
                    {user?.email || user?.phone || 'Devotee'}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-6 mt-4 pt-4 border-t border-white/20">
                <div className="text-center">
                  <div className="text-lg font-bold">12</div>
                  <div className="text-xs text-white/80">Prayers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">3</div>
                  <div className="text-xs text-white/80">Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">₹500</div>
                  <div className="text-xs text-white/80">Donated</div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4">
              <nav className="space-y-2">
                {menuItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleMenuClick(item)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left 
                                  hover:bg-muted transition-colors group
                                  ${item.premium ? 'bg-gradient-to-r from-secondary/10 to-accent/10' : ''}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 + 0.2 }}
                      whileHover={{ x: 4 }}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                                      ${item.premium 
                                        ? 'bg-gradient-to-r from-secondary to-accent text-white' 
                                        : 'bg-muted group-hover:bg-primary/10'
                                      }`}>
                        <IconComponent size={20} className={
                          item.premium 
                            ? 'text-white' 
                            : 'text-muted-foreground group-hover:text-primary'
                        } />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{item.label}</span>
                          {item.premium && (
                            <span className="text-xs bg-gradient-to-r from-secondary to-accent 
                                           text-white px-2 py-0.5 rounded-full">
                              Premium
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </nav>

              {/* PWA Install Button */}
              <div className="mt-6 pt-6 border-t border-border">
                <motion.button
                  onClick={() => {
                    // Try to trigger PWA install manually
                    if (window.deferredPrompt) {
                      window.deferredPrompt.prompt();
                    } else {
                      alert('To install this app, use your browser menu and look for "Install" or "Add to Home Screen" option');
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left 
                             hover:bg-muted transition-colors group border-2 border-dashed border-primary/30"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 }}
                  whileHover={{ x: 4 }}
                >
                  <div className="w-10 h-10 bg-primary/10 group-hover:bg-primary/20 rounded-lg 
                                  flex items-center justify-center">
                    <Download size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Install App</div>
                    <div className="text-xs text-muted-foreground">Add to home screen</div>
                  </div>
                </motion.button>
              </div>

              {/* Theme Toggle */}
              <div className="mt-6 pt-6 border-t border-border">
                <motion.button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left 
                             hover:bg-muted transition-colors group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                  whileHover={{ x: 4 }}
                >
                  <div className="w-10 h-10 bg-muted group-hover:bg-primary/10 rounded-lg 
                                  flex items-center justify-center">
                    {isDarkMode ? (
                      <Sun size={20} className="text-muted-foreground group-hover:text-primary" />
                    ) : (
                      <Moon size={20} className="text-muted-foreground group-hover:text-primary" />
                    )}
                  </div>
                  <span className="font-medium text-foreground">
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </motion.button>
              </div>

              {/* Logout Button */}
              <div className="mt-6 pt-6 border-t border-border">
                <motion.button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left 
                             hover:bg-destructive/10 transition-colors group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.9 }}
                  whileHover={{ x: 4 }}
                >
                  <div className="w-10 h-10 bg-destructive/10 group-hover:bg-destructive/20 rounded-lg 
                                  flex items-center justify-center">
                    <LogOut size={20} className="text-destructive" />
                  </div>
                  <span className="font-medium text-destructive">Logout</span>
                </motion.button>
              </div>

              {/* App Version */}
              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Divine Temple App v1.0.0
                </p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Shield size={12} className="text-primary" />
                  <span className="text-xs text-primary">Secured & Blessed</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;