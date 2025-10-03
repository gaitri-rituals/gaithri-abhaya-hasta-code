import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  Clock,
  Users,
  Play,
  Heart,
  Star,
  Filter,
  MapPin,
  Trophy,
  ChevronRight,
} from "lucide-react";
import InnerPageWrapper from "../components/InnerPageWrapper";
import { classCategories, templeClasses, gurus } from "../data/templeClasses";
import { getClassSubscriptions } from "../utils/localStorage";

const Classes = () => {
  const navigate = useNavigate();
  const tabRefs = useRef({});
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [userSubscriptions, setUserSubscriptions] = useState([]);

  useEffect(() => {
    const subscriptions = getClassSubscriptions();
    setUserSubscriptions(subscriptions);
  }, []);

  const handleBackClick = () => {
    navigate("/");
  };

  const handleEnrollClick = (classId) => {
    navigate(`/class-enrollment/${classId}/step/1`);
  };

  const filteredClasses =
    selectedCategory === "all"
      ? templeClasses
      : templeClasses.filter((cls) => cls.category === selectedCategory);

  const getGuruForClass = (classData) => {
    return gurus.find((guru) => guru.id === classData.guruId);
  };

  useEffect(() => {
    if (selectedCategory && tabRefs.current[selectedCategory]) {
      tabRefs.current[selectedCategory].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedCategory]);

  return (
    <InnerPageWrapper title="Spiritual Classes" onBackClick={handleBackClick}>
      <div className="relative">
        {/* Sticky Category Tabs */}
        <div className="sticky top-16 p-3 z-20 backdrop-blur-md shadow-festival bg-gradient-to-br from-gray-300 via-orange-50 to-gray-300">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {/* My Subscriptions Badge */}
            {userSubscriptions.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate("/my-subscriptions")}
                className="flex-shrink-0 px-4 py-2 bg-gradient-divine text-white rounded-full text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <BookOpen size={16} />
                My Classes ({userSubscriptions.length})
              </motion.button>
            )}

            {/* All Categories */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              ref={(el) => (tabRefs.current["all"] = el)}
              onClick={() => setSelectedCategory("all")}
              className="relative flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium"
            >
              <span
                className={`relative z-10 ${
                  selectedCategory === "all"
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Classes
              </span>

              {selectedCategory === "all" && (
                <motion.span
                  layoutId="active-category"
                  className="absolute inset-px rounded-full bg-primary/90 shadow"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>

            {/* Category Badges */}
            {classCategories.map((category) => (
              <motion.button
                key={category.id}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                ref={(el) => (tabRefs.current[category.id] = el)}
                onClick={() => setSelectedCategory(category.id)}
                className="relative flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
              >
                <span
                  className={`relative z-10 flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {category.icon} {category.name}
                </span>

                {selectedCategory === category.id && (
                  <motion.span
                    layoutId="active-category"
                    className="absolute inset-px rounded-full bg-primary/90 shadow"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

         

        {/* Classes Grid */}
        <div className="space-y-4 p-2">
          {filteredClasses.map((classItem, index) => {
            const guru = getGuruForClass(classItem);
            return (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100"
                onClick={() => handleEnrollClick(classItem.id)}
              >
                <div className="p-4 flex flex-col gap-3">
                  {/* Top Row */}
                  <div className="flex items-start gap-3">
                    {/* Guru Photo */}
                    <div className="w-14 h-14 rounded-full bg-gradient-divine flex items-center justify-center text-2xl shadow-sm">
                      {guru?.photo || classItem.image}
                    </div>

                    {/* Class Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-base text-foreground leading-tight">
                            {classItem.title}
                          </h3>
                          <p className="text-sm text-primary font-medium">
                            with {guru?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Star
                            size={14}
                            className="text-yellow-500 fill-current"
                          />
                          <span className="font-medium">
                            {classItem.rating}
                          </span>
                        </div>
                      </div>

                      {/* Levels */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {classItem.level.map((level, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                          >
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{classItem.temple}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="shrink-0" />
                      <span>{classItem.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} className="shrink-0" />
                      <span>{classItem.studentsCount} students</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <span className="text-sm font-semibold text-primary">
                    ₹{classItem.subscriptionPlans[0].price}/month
                  </span>
                  <button className="btn-divine flex items-center gap-2 text-sm py-1.5 px-3">
                    Enroll Now
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredClasses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Classes Found
            </h3>
            <p className="text-muted-foreground mb-4">
              No classes available in this category yet
            </p>
            <button
              onClick={() => setSelectedCategory("all")}
              className="btn-divine"
            >
              View All Classes
            </button>
          </div>
        )}
      </div>
    </InnerPageWrapper>
  );
};

export default Classes;
