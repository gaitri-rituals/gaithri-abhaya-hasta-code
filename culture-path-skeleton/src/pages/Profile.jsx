import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Edit3, 
  Settings, 
  Bell, 
  Heart, 
  BookOpen,
  Award,
  Calendar,
  LogOut,
  ChevronRight,
  Star,
  Clock
} from 'lucide-react';
import { useAppStore } from '../state/store';
import InnerPageWrapper from '../components/InnerPageWrapper';

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAppStore();

  const handleBackClick = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to login
      navigate('/login');
    }
  };

  const stats = [
    { label: 'Prayer Days', value: 45, icon: Calendar, color: 'text-blue-600' },
    { label: 'Classes Joined', value: 12, icon: BookOpen, color: 'text-green-600' },
    { label: 'Community Points', value: 234, icon: Star, color: 'text-yellow-600' },
    { label: 'Achievements', value: 8, icon: Award, color: 'text-purple-600' }
  ];

  const menuItems = [
    {
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: Edit3,
      action: () => console.log('Edit Profile')
    },
    {
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      icon: Bell,
      action: () => console.log('Notifications')
    },
    {
      title: 'Favorites',
      subtitle: 'Your saved prayers and mantras',
      icon: Heart,
      action: () => console.log('Favorites')
    },
    {
      title: 'Settings',
      subtitle: 'App preferences and privacy',
      icon: Settings,
      action: () => console.log('Settings')
    }
  ];

  const recentActivity = [
    {
      type: 'prayer',
      title: 'Completed morning prayers',
      time: '2 hours ago',
      icon: '🙏'
    },
    {
      type: 'class',
      title: 'Joined Meditation class',
      time: '1 day ago',
      icon: '🧘‍♂️'
    },
    {
      type: 'community',
      title: 'Shared spiritual experience',
      time: '2 days ago',
      icon: '💭'
    }
  ];

  return (
    <InnerPageWrapper
      title="My Profile"
      onBackClick={handleBackClick}
      rightContent={
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <LogOut size={20} className="text-foreground" />
        </button>
      }
    >
      <div className="p-4">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 bg-gradient-divine rounded-full flex items-center justify-center text-4xl shadow-divine">
              👤
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors">
              <Edit3 size={14} />
            </button>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {user?.name || 'Divine Devotee'}
          </h1>
          <p className="text-muted-foreground mb-2">
            {user?.email || user?.phone || 'Spiritual Seeker'}
          </p>
          <div className="flex items-center justify-center gap-1 text-sm">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium text-foreground">January 2024</span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card-divine text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-lg font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Account</h2>
          <div className="space-y-3">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.title}
                  onClick={item.action}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="w-full card-divine flex items-center justify-between hover:shadow-divine transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <Icon size={18} className="text-foreground" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-foreground">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.subtitle}</div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
              >
                <div className="text-xl">{activity.icon}</div>
                <div className="flex-1">
                  <div className="font-medium text-foreground text-sm">{activity.title}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={10} />
                    {activity.time}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Spiritual Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="card-divine bg-gradient-divine text-white">
            <div className="text-center">
              <Award className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Spiritual Journey Progress</h3>
              <p className="text-sm opacity-90 mb-4">
                You're on a beautiful path of spiritual growth
              </p>
              
              <div className="bg-white/20 rounded-full h-2 mb-2">
                <div className="bg-white rounded-full h-2 w-3/4 transition-all duration-500"></div>
              </div>
              <p className="text-xs opacity-80">Level 3 - Dedicated Devotee (75% complete)</p>
            </div>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="pt-4 border-t border-border"
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 p-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign Out</span>
          </button>
        </motion.div>
      </div>
    </InnerPageWrapper>
  );
};

export default Profile;