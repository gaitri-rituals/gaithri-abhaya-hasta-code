import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Menu,
  MapPin,
  Globe,
  QrCode,
  Home as HomeIcon,
  GraduationCap,
  Store,
  Users,
  User,
  Bell,
  Calendar,
  Heart,
  Sparkles,
  Church,
  Atom,
  Network,
  Search,
} from "lucide-react";
import { useAppStore } from "../state/store";
import { addressApi } from "../services/addressApi";
import Sidebar from "../components/Sidebar";
import LanguageSelector from "../components/LanguageSelector";
import QRScanner from "../components/QRScanner";
import CardSlider from "../components/ui/cardSlider";
import Modal from "../components/ui/modal";

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, currentAddress, setCurrentAddress } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [addresses, setAddresses] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(true);

  // Fetch addresses from backend
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoadingAddress(true);
        const response = await addressApi.getAll();
        if (response.success && response.data) {
          setAddresses(response.data);

          // Set current address if not already set
          if (!currentAddress && response.data.length > 0) {
            // Find default address or use first one
            const defaultAddr = response.data.find(addr => addr.is_default) || response.data[0];
            setCurrentAddress({
              id: defaultAddr.id,
              label: defaultAddr.label,
              fullName: `${defaultAddr.street}, ${defaultAddr.city}, ${defaultAddr.state}`,
              shortName: defaultAddr.label,
              type: defaultAddr.type,
              ...defaultAddr
            });
          }
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddresses();
  }, [currentAddress, setCurrentAddress]);

  const tabs = [
    { id: "home", icon: HomeIcon, label: t("nav.home") },
    { id: "class", icon: GraduationCap, label: t("nav.class") },
    { id: "store", icon: Store, label: t("nav.store") },
    { id: "community", icon: Users, label: t("nav.community") },
    { id: "profile", icon: User, label: t("nav.profile") },
  ];

  const services = [
    {
      id: "explore",
      title: "Explore Temples",
      icon: Search,
      color: "from-primary to-primary-glow",
      onClick: () => navigate("/explore-temples"),
    },
    {
      id: "classes",
      title: "Temple Classes",
      icon: GraduationCap,
      color: "from-secondary to-accent",
      onClick: () => navigate("/classes"),
    },
    {
      id: "ceremonies",
      title: "Book a Puja",
      icon: Sparkles,
      color: "from-accent to-sacred",
      onClick: () => navigate("/puja-booking"),
    },
    {
      id: "community-events",
      title: "My Community",
      icon: Network,
      color: "from-sacred to-primary",
      onClick: () => navigate("/community"),
    },
  ];

  const prayers = [
    { id: 1, title: "Today's Special Prayer", time: "7:00 PM" },
    { id: 2, title: "Morning Puja", time: "6:30 AM" },
    { id: 3, title: "Weekend Bhajan", time: "8:00 PM" },
    // add as many cards as needed
  ];

  return (
    <div className="min-h-screen bg-gradient-temple">
      {/* Header */}
      <header className="nav-divine px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Menu size={24} className="text-foreground" />
          </button>

          {/* Center: Address */}
          <button
            onClick={() => navigate("/address")}
            className="flex-1 flex items-center justify-center gap-2 mx-4 px-2 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors max-w-xs"
          >
            <MapPin size={16} className="text-primary flex-shrink-0" />
            {loadingAddress ? (
              <span className="text-sm text-muted-foreground">Loading...</span>
            ) : (
              <div className="flex flex-col items-start min-w-0">
                <span className="text-xs text-muted-foreground">                  {currentAddress?.label || currentAddress?.shortName || "Select Address"}
                </span>
                <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                  {currentAddress?.street}
                </span>
              </div>
            )}
          </button>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLanguageSelector(true)}
              className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Globe size={20} className="text-foreground" />
            </button>

            <button
              onClick={() => setShowQRScanner(true)}
              className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
            >
              <QrCode size={20} className="text-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-4 pb-24">
        {/* Featured Service */}
        <CardSlider auto interval={4500} pauseOnHover>
          {prayers.map((prayer, i) => (
            <div
              className="w-full bg-gradient-to-r from-orange-400 to-orange-500 space-x-4 text-white px-6 py-10 shadow-lg"
              key={i}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">{prayer.title}</h2>
                  <p className="text-white/90 mb-4">
                    Join the evening Aarti ceremony at {prayer.time}
                  </p>
                  <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-lg hover:bg-white/30 transition-all font-medium">
                    Join Now
                  </button>
                </div>
                <div className="ml-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Heart size={32} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardSlider>

        {/* Services Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8 px-2"
        >
          <h3 className="text-xl font-bold text-foreground mb-4">
            Sacred Services
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <motion.button
                  key={service.id}
                  onClick={service.onClick}
                  className="card-divine text-left p-4 hover:shadow-sacred transition-all"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${service.color} 
                                   flex items-center justify-center mb-3 shadow-sm`}
                  >
                    <IconComponent size={24} className="text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">
                    {service.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="px-2"
        >
          <h3 className="text-xl font-bold text-foreground mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/puja-booking")}
              className="card-temple w-full flex items-center gap-4 p-4 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Sparkles size={20} className="text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium text-foreground">
                  Book Puja Ceremony
                </h4>
                <p className="text-sm text-muted-foreground">
                  Schedule traditional rituals and pujas
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate("/my-bookings")}
              className="card-temple w-full flex items-center gap-4 p-4 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Heart size={20} className="text-secondary" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium text-foreground">My Bookings</h4>
                <p className="text-sm text-muted-foreground">
                  View your temple visits and bookings
                </p>
              </div>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-2 py-3">
        <div className="flex justify-around max-w-md mx-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "home") {
                    setActiveTab(tab.id);
                  } else if (tab.id === "class") {
                    navigate("/classes");
                  } else {
                    navigate(`/${tab.id}`);
                  }
                }}
                className={`tab-divine ${isActive ? "active" : ""}`}
              >
                <IconComponent size={20} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals and Overlays */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Modal
        showCloseButton={false}
        isOpen={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      >
        <LanguageSelector onClose={() => setShowLanguageSelector(false)} />
      </Modal>

      {showQRScanner && <QRScanner onClose={() => setShowQRScanner(false)} />}
    </div>
  );
};

export default Home;
