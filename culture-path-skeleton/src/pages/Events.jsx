import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Filter,
  Search,
  Star,
  Heart,
  Share2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import InnerPageWrapper from "../components/InnerPageWrapper";
import { eventsAPI } from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";

const Events = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showSearch, setShowSearch] = useState(false);

  const handleBackClick = () => {
    navigate("/");
  };

  // Fetch events data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventsData, categoriesData, registrationsData] = await Promise.all([
          eventsAPI.getAll(),
          eventsAPI.getCategories(),
          eventsAPI.getMyRegistrations(),
        ]);
        
        setEvents(eventsData.events || []);
        setCategories(categoriesData.categories || []);
        setMyRegistrations(registrationsData.registrations || []);
      } catch (error) {
        console.error("Error fetching events data:", error);
        toast({
          title: "Error",
          description: "Failed to load events. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Filter events based on search, category, and tab
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Apply tab filter
    if (activeTab === "registered") {
      const registeredEventIds = myRegistrations.map(reg => reg.event_id);
      filtered = filtered.filter(event => registeredEventIds.includes(event.id));
    } else if (activeTab === "upcoming") {
      const now = new Date();
      filtered = filtered.filter(event => new Date(event.event_date) > now);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    return filtered;
  }, [events, myRegistrations, searchQuery, selectedCategory, activeTab]);

  const handleRegister = async (eventId) => {
    try {
      await eventsAPI.register(eventId);
      
      // Refresh registrations
      const registrationsData = await eventsAPI.getMyRegistrations();
      setMyRegistrations(registrationsData.registrations || []);
      
      toast({
        title: "Success",
        description: "Successfully registered for the event!",
      });
    } catch (error) {
      console.error("Error registering for event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to register for event.",
        variant: "destructive",
      });
    }
  };

  const handleCancelRegistration = async (eventId) => {
    try {
      await eventsAPI.cancelRegistration(eventId);
      
      // Refresh registrations
      const registrationsData = await eventsAPI.getMyRegistrations();
      setMyRegistrations(registrationsData.registrations || []);
      
      toast({
        title: "Success",
        description: "Registration cancelled successfully.",
      });
    } catch (error) {
      console.error("Error cancelling registration:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel registration.",
        variant: "destructive",
      });
    }
  };

  const isRegistered = (eventId) => {
    return myRegistrations.some(reg => reg.event_id === eventId);
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const eventDate = new Date(event.event_date);
    
    if (eventDate < now) return "past";
    if (event.current_participants >= event.max_participants) return "full";
    return "open";
  };

  const tabs = [
    { id: "all", label: "All Events" },
    { id: "upcoming", label: "Upcoming" },
    { id: "registered", label: "My Events" },
  ];

  if (loading) {
    return (
      <InnerPageWrapper title="Temple Events" onBackClick={handleBackClick}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </InnerPageWrapper>
    );
  }

  return (
    <InnerPageWrapper
      title="Temple Events"
      onBackClick={handleBackClick}
      rightContent={
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <Search size={20} className="text-foreground" />
        </button>
      }
    >
      {/* Search Bar */}
      {showSearch && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="sticky top-16 p-3 z-20 backdrop-blur-md shadow-festival bg-gradient-to-br from-gray-300 via-orange-50 to-gray-300">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium"
              >
                <span
                  className={`relative z-10 ${
                    isActive
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="active-events-tab"
                    className="absolute inset-px rounded-full bg-primary/90 shadow"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("")}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === category.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 mt-4 space-y-4"
      >
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Events Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory
                ? "Try adjusting your search or filters"
                : "No events available at the moment"}
            </p>
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const status = getEventStatus(event);
            const registered = isRegistered(event.id);
            
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-divine"
              >
                {/* Event Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground text-lg">{event.title}</h3>
                      {registered && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle size={12} className="mr-1" />
                          Registered
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                  <Badge
                    variant={
                      status === "past" ? "secondary" :
                      status === "full" ? "destructive" : "default"
                    }
                    className="ml-2"
                  >
                    {status === "past" ? "Past" :
                     status === "full" ? "Full" : "Open"}
                  </Badge>
                </div>

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={16} />
                    <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    <Clock size={16} className="ml-2" />
                    <span>{event.start_time} - {event.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={16} />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users size={16} />
                    <span>{event.current_participants} / {event.max_participants} participants</span>
                  </div>
                </div>

                {/* Event Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Heart size={16} />
                      <span className="text-xs">Save</span>
                    </button>
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Share2 size={16} />
                      <span className="text-xs">Share</span>
                    </button>
                  </div>
                  
                  {status !== "past" && (
                    <div className="flex gap-2">
                      {registered ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelRegistration(event.id)}
                          className="text-xs"
                        >
                          <XCircle size={14} className="mr-1" />
                          Cancel
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleRegister(event.id)}
                          disabled={status === "full"}
                          className="text-xs"
                        >
                          <CheckCircle size={14} className="mr-1" />
                          {status === "full" ? "Full" : "Register"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </InnerPageWrapper>
  );
};

export default Events;