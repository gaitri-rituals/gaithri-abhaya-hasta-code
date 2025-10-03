import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Heart, Star } from "lucide-react";
import { templeAPI } from "../services/api";
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
} from "../utils/localStorage";
import InnerPageWrapper from "../components/InnerPageWrapper";

const ExploreTemples = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [favorites, setFavorites] = useState(getFavorites());
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(["all"]);

  const tabRefs = useRef({});

  // Fetch temples from API
  useEffect(() => {
    const fetchTemples = async () => {
      try {
        setLoading(true);
        const response = await templeAPI.getAll();
        // Handle both response formats: {temples: [...]} or direct array
        const templesData = response?.temples || response || [];
        const templesArray = Array.isArray(templesData) ? templesData : [];
        setTemples(templesArray);
        
        // Extract unique categories from temples
        const uniqueCategories = [...new Set(
          templesArray
            .map(temple => temple.category)
            .filter(Boolean) // Remove null/undefined
        )].sort();
        
        // Add "all" as first option
        setCategories(["all", ...uniqueCategories]);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch temples:', err);
        setError(err.message);
        // Fallback to empty array on error
        setTemples([]);
        setCategories(["all"]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemples();
  }, []);

  const filteredTemples = useMemo(() => {
    return temples.filter((temple) => {
      const deity = temple.primaryDeity || temple.deity || '';
      const location = temple.address?.city || temple.location || '';
      
      const matchesSearch =
        temple.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || temple.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [temples, searchQuery, categoryFilter]);

  const handleBackClick = () => {
    navigate("/");
  };

  // Auto-scroll selected tab into view
  useEffect(() => {
    if (tabRefs.current[categoryFilter]) {
      tabRefs.current[categoryFilter].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [categoryFilter]);

  if (loading) {
    return (
      <InnerPageWrapper
        title="Explore Temples"
        onBackClick={handleBackClick}
        rightContent={null}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading temples...</p>
          </div>
        </div>
      </InnerPageWrapper>
    );
  }

  if (error) {
    return (
      <InnerPageWrapper
        title="Explore Temples"
        onBackClick={handleBackClick}
        rightContent={null}
      >
        <div className="text-center py-12">
          <p className="text-red-500 text-lg mb-2">Error loading temples</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-primary text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </InnerPageWrapper>
    );
  }

  return (
    <InnerPageWrapper
      title="Explore Temples"
      onBackClick={handleBackClick}
      rightContent={null}
    >
      <div className="space-y-6">
        {/* Category Tabs */}
        <div className="sticky top-16 p-3 z-20 backdrop-blur-md shadow-festival bg-gradient-to-br from-gray-300 via-orange-50 to-gray-300">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide relative">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                ref={(el) => (tabRefs.current[cat] = el)}
                onClick={() => setCategoryFilter(cat)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap`}
              >
                {/* Animated background */}
                {categoryFilter === cat && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary text-white rounded-full shadow"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}

                {/* Text must stay above background */}
                <span
                  className={`relative z-10 ${
                    categoryFilter === cat ? "text-white" : "text-foreground"
                  }`}
                >
                  {cat === "all" ? "All Temples" : cat}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Temple Cards */}
        <div className="space-y-4 px-2">
          {filteredTemples.map((temple, index) => (
            <motion.div
              key={temple.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-border overflow-hidden shadow hover:shadow-md transition"
            >
              {/* Temple Image */}
              <div className="relative">
                <img
                  src={temple.images?.[0] || '/placeholder-temple.jpg'}
                  alt={temple.name}
                  className="w-full h-48 object-cover bg-gray-200"
                />
                {/* Map Navigation Button */}
                <button
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${temple.address?.coordinates?.latitude},${temple.address?.coordinates?.longitude}`,
                      "_blank"
                    )
                  }
                  className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                >
                  <MapPin size={18} className="text-orange-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Name + Category */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {temple.name}
                    </h3>
                    <p className="text-sm text-gray-500">{temple.primaryDeity}</p>
                  </div>
                  <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-medium">
                    {temple.category}
                  </span>
                </div>

                {/* Location + Distance */}
                <div className="flex items-center text-gray-600 text-sm mb-2">
                  <MapPin size={14} className="mr-1" />
                  <span>{temple.address?.city || ''}{temple.address?.city && temple.address?.state ? ', ' : ''}{temple.address?.state || ''}</span>
                  {temple.distance && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{temple.distance}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Footer (like your Sitar card) */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-border">
                {/* Rating */}
                <div className="flex items-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(temple.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600 font-medium">
                    {temple.rating > 0 ? temple.rating.toFixed(1) : 'New'}
                    {temple.totalReviews > 0 && ` (${temple.totalReviews})`}
                  </span>
                </div>
                <motion.button
                  onClick={() => navigate(`/temple/${temple.id}`)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Details
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredTemples.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No temples found matching your criteria
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Try adjusting your search
            </p>
          </div>
        )}
      </div>
    </InnerPageWrapper>
  );
};

export default ExploreTemples;
