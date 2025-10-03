import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import { pujaCategories } from "../data/pujaCategories";
import InnerPageWrapper from "../components/InnerPageWrapper";

const PujaBooking = () => {
  const tabRefs = useRef({});
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(pujaCategories[0]); // default first

  const handleBackClick = () => navigate("/");

  const handlePujaSelect = (puja) => {
    navigate("/puja-booking-details", {
      state: { selectedPuja: puja, category: selectedCategory },
    });
  };

  useEffect(() => {
    if (selectedCategory && tabRefs.current[selectedCategory.id]) {
      tabRefs.current[selectedCategory.id].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedCategory]);

  return (
    <InnerPageWrapper
      title="Book Puja"
      onBackClick={handleBackClick}
      rightContent={null}
    >
      {/* Category Tabs */}
      <div className="sticky top-16 p-3 z-20 backdrop-blur-md shadow-festival bg-gradient-to-br from-gray-300 via-orange-50 to-gray-300">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide ">
          {pujaCategories.map((category) => (
            <motion.button
              key={category.id}
              ref={(el) => (tabRefs.current[category.id] = el)}
              onClick={() => setSelectedCategory(category)}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className={`relative flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory?.id === category.id
                  ? "bg-primary text-white shadow"
                  : "text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {category.icon} {category.title}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Puja List */}
      <div className="p-4 pb-20 space-y-4">
        {selectedCategory?.pujas.map((puja, index) => (
          <motion.div
            key={puja.id}
            onClick={() => handlePujaSelect(puja)}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Puja Icon or Emoji */}
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-100 text-2xl">
                    {puja.icon || "🙏"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {puja.name}
                    </h3>
                    <p className="text-sm text-orange-600">
                      with {puja.priest || "Pandit Ji"}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                {puja.rating && (
                  <div className="flex items-center text-sm text-yellow-500 font-medium">
                    ⭐ {puja.rating}
                  </div>
                )}
              </div>

              {/* Tags */}
              {puja.levels && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {puja.levels.map((level) => (
                    <span
                      key={level}
                      className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
                    >
                      {level}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                {puja.description}
              </p>

              {/* Meta info */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                {puja.location && (
                  <div className="flex items-center gap-1">
                    📍 <span>{puja.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  ⏱ <span>{puja.duration}</span>
                </div>
                {puja.students && (
                  <div className="flex items-center gap-1">
                    👥 <span>{puja.students} devotees</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-5 py-3">
              <div>
                <span className="text-sm text-gray-500 block">
                  Starting from
                </span>
                <span className="text-lg font-bold text-orange-600">
                  ₹{puja.basePrice.toLocaleString()}
                </span>
              </div>
              <button className="px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium shadow hover:shadow-md transition">
                Book Now →
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </InnerPageWrapper>
  );
};

export default PujaBooking;
