import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ShoppingBag,
  Star,
  Filter,
  Search,
  Heart,
  Plus,
  Minus,
  Check,
  Clock,
} from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import InnerPageWrapper from "../components/InnerPageWrapper";
import useCartStore from "../store/cartStore";
import { storeProducts, storeCategories } from "../data/storeProducts";
import { Badge } from "../components/ui/badge";
import { storeAPI } from "../services/api";

const Store = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false); // 🔑 toggle search
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const tabRefs = useRef({});

  // 🔑 scroll into view when selectedCategory changes
  useEffect(() => {
    if (tabRefs.current[selectedCategory]) {
      tabRefs.current[selectedCategory].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const [itemsResponse, categoriesResponse] = await Promise.all([
        storeAPI.getItems(),
        storeAPI.getCategories()
      ]);
      
      setProducts(itemsResponse.data || storeProducts); // Fallback to mock data
      setCategories(categoriesResponse.data || storeCategories); // Fallback to mock data
    } catch (error) {
      console.error('Error fetching store data:', error);
      // Use mock data as fallback
      setProducts(storeProducts);
      setCategories(storeCategories);
    } finally {
      setLoading(false);
    }
  };

  const { cartItems, addToCart, updateQuantity, getCartItemCount } =
    useCartStore();
  const cartItemCount = getCartItemCount();

  const handleBackClick = () => {
    navigate("/");
  };

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);

  const getProductQuantity = (productId) => {
    const item = cartItems.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = (product) => {
    if (!product.inStock) return;
    addToCart(product);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    updateQuantity(productId, newQuantity);
  };

  return (
    <InnerPageWrapper
      title="Divine Store"
      onBackClick={handleBackClick}
      rightContent={
        <div className="flex items-center gap-2">
          {/* Search Icon Toggle */}
          <button
            onClick={() => setShowSearch((prev) => !prev)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <Search size={20} className="text-foreground" />
          </button>

          {/* Basket */}
          <button
            onClick={() => navigate("/basket")}
            className="p-2 hover:bg-muted rounded-full transition-colors relative"
          >
            <ShoppingBag size={20} className="text-foreground" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      }
    >
      <div className="">
        {/* Search Input */}
        {showSearch && (
          <div className="p-3 sticky top-16 z-30 bg-gradient-to-br from-gray-300 via-orange-50 to-gray-300 backdrop-blur-md shadow-festival">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        )}
        
        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* Categories */}
          <div className="sticky top-16 p-3 z-20 backdrop-blur-md shadow-festival bg-gradient-to-br from-gray-300 via-orange-50 to-gray-300">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {/* All Button */}
              <motion.button
                ref={(el) => (tabRefs.current["all"] = el)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedCategory("")}
                className="relative flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium"
              >
                <span
                  className={`relative z-10 ${
                    selectedCategory === ""
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </span>

                {selectedCategory === "" && (
                  <motion.span
                    layoutId="active-store-tab"
                    className="absolute inset-px rounded-full bg-primary/90 shadow"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>

              {/* Dynamic Categories */}
              {categories.map((category, index) => (
                <motion.button
                  key={category.id}
                  ref={(el) => (tabRefs.current[category.name] = el)}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedCategory(category.name)}
                  className="relative flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
                >
                  <span
                    className={`relative z-10 flex items-center gap-2 ${
                      selectedCategory === category.name
                        ? "text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium">{category.name}</div>
                      <div className="text-xs opacity-80">
                        {category.count} items
                      </div>
                    </div>
                  </span>

                  {selectedCategory === category.name && (
                    <motion.span
                      layoutId="active-store-tab"
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
        </motion.div>

        {/* Products Grid */}
        <div className="grid  gap-4 px-2">
          {filteredProducts.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <p className="text-muted-foreground">
                No products found matching your criteria
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("");
                }}
                className="mt-4 text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredProducts.map((product, index) => {
              const quantity = getProductQuantity(product.id);
              const isInCart = quantity > 0;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  {/* Main Content Row */}
                  <div className="flex p-4 gap-4">
                    {/* Left - Image (1/4th) */}
                    <div className="w-1/4 flex items-start justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl">
                        {product.image}
                      </div>
                    </div>

                    {/* Right - Text Content (3/4th) */}
                    <div className="w-3/4 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-orange-600 mb-2">
                          {product.vendor}
                        </p>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Section */}
                  <div className="border-t px-5 py-4 flex items-center justify-between bg-gray-50">
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Starting from
                      </span>
                      <span className="text-lg font-bold text-orange-600">
                        ₹{product.price.toLocaleString()}
                      </span>
                    </div>

                    {/* Conditional Button / Quantity Controls */}
                    {quantity === 0 ? (
                      <motion.button
                        onClick={() => handleAddToCart(product)}
                        className="btn-divine px-5 py-2 rounded-lg text-sm font-medium transition"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {product.inStock ? "Add →" : "Out of Stock"}
                      </motion.button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={() =>
                            handleQuantityChange(product.id, quantity - 1)
                          }
                          className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition"
                          whileTap={{ scale: 0.9 }}
                        >
                          <Minus size={16} />
                        </motion.button>

                        <span className="text-sm font-medium w-6 text-center">
                          {quantity}
                        </span>

                        <motion.button
                          onClick={() =>
                            handleQuantityChange(product.id, quantity + 1)
                          }
                          className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition"
                          whileTap={{ scale: 0.9 }}
                        >
                          <Plus size={16} />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Load More */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <button className="btn-temple py-3 px-8">Load More Products</button>
        </motion.div>
      </div>
    </InnerPageWrapper>
  );
};

export default Store;
