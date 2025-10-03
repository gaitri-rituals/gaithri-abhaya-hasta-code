import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  MessageCircle,
  Heart,
  Share2,
  Clock,
  Plus,
  Flame,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import InnerPageWrapper from "../components/InnerPageWrapper";
import { communityAPI, eventsAPI } from '../services/api';

const Community = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '' });
  const [showCreatePost, setShowCreatePost] = useState(false);

  const handleBackClick = () => {
    navigate("/");
  };

  const tabs = [
    { id: "posts", label: "Posts", icon: MessageCircle },
    { id: "events", label: "Events", icon: Flame },
    { id: "members", label: "Members", icon: Users },
  ];

  const tabRefs = useRef({});

  useEffect(() => {
    if (activeTab && tabRefs.current[activeTab]) {
      tabRefs.current[activeTab].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [setActiveTab]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsResponse, eventsResponse, categoriesResponse] = await Promise.all([
        communityAPI.getPosts(),
        eventsAPI.getUpcoming(),
        communityAPI.getCategories()
      ]);
      
      setPosts(postsResponse.data || []);
      setEvents(eventsResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    try {
      if (!newPost.title || !newPost.content) return;
      
      const response = await communityAPI.createPost(newPost);
      setPosts([response.data, ...posts]);
      setNewPost({ title: '', content: '', category: '' });
      setShowCreatePost(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      // Optimistically update UI
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes: (post.likes || 0) + 1, isLiked: !post.isLiked }
          : post
      ));
      
      // Make API call (assuming we have a like endpoint)
      // await communityAPI.likePost(postId);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const mockPosts = [
    {
      id: 1,
      author: "Priya Sharma",
      avatar: "👩",
      time: "2h ago",
      content:
        "Just completed my morning prayers at the temple. The divine energy was incredible today! 🙏 Feeling blessed and grateful.",
      image: "🏛️",
      likes: 24,
      comments: 8,
      shares: 3,
      type: "experience",
    },
    {
      id: 2,
      author: "Rajesh Kumar",
      avatar: "👨",
      time: "5h ago",
      content:
        "Can anyone share the correct pronunciation of the Gayatri Mantra? I want to make sure I'm chanting it properly.",
      likes: 12,
      comments: 15,
      shares: 2,
      type: "question",
    },
    {
      id: 3,
      author: "Devi Ananda",
      avatar: "👵",
      time: "1d ago",
      content:
        "Today marks my 50th day of continuous meditation practice! The inner peace I've found is beyond words. Thank you to this beautiful community for the support. 🧘‍♀️✨",
      likes: 87,
      comments: 23,
      shares: 12,
      type: "milestone",
    },
    {
      id: 4,
      author: "Temple Admin",
      avatar: "🏛️",
      time: "2d ago",
      content:
        "Reminder: Special Ganga Aarti ceremony tomorrow evening at 6 PM. All devotees are welcome to participate. Light refreshments will be served after the ceremony.",
      likes: 156,
      comments: 34,
      shares: 45,
      type: "announcement",
    },
  ];

  const mockEvents = [
    {
      id: 1,
      title: "Ganga Aarti Ceremony",
      date: "Tomorrow",
      time: "6:00 PM",
      participants: 156,
      image: "🪔",
    },
    {
      id: 2,
      title: "Meditation Workshop",
      date: "This Weekend",
      time: "9:00 AM",
      participants: 45,
      image: "🧘‍♂️",
    },
  ];

  const members = [
    {
      name: "Swami Ananda",
      role: "Spiritual Guide",
      followers: 234,
      avatar: "👨‍🦳",
    },
    {
      name: "Priya Sharma",
      role: "Community Leader",
      followers: 89,
      avatar: "👩",
    },
    {
      name: "Rajesh Kumar",
      role: "Active Member",
      followers: 67,
      avatar: "👨",
    },
  ];

  return (
    <InnerPageWrapper
      title="Divine Community"
      onBackClick={handleBackClick}
      rightContent={
        <button className="p-2 hover:bg-muted rounded-full transition-colors">
          <Plus size={20} className="text-foreground" />
        </button>
      }
    >
      <div className="sticky top-16 p-3 z-20 backdrop-blur-md shadow-festival bg-gradient-to-br from-gray-300 via-orange-50 to-gray-300">
  <div className="flex gap-2 overflow-x-auto scrollbar-hide ">
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;

      return (
        <motion.button
          key={tab.id}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          ref={(el) => (tabRefs.current[tab.id] = el)}
          onClick={() => setActiveTab(tab.id)}
          className="relative flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
        >
          {/* Label + Icon */}
          <span
            className={`relative z-10 flex items-center gap-2 ${
              isActive
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {Icon && <Icon size={16} />} {tab.label}
          </span>

          {/* Animated background */}
          {isActive && (
            <motion.span
              layoutId="active-community-tab"
              className="absolute inset-px rounded-full bg-primary/90 shadow"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </motion.button>
      );
    })}
  </div>
</div>

      {/* Content Based on Active Tab */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-2 mt-4"
      >
        {activeTab === "posts" && (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-divine"
              >
                {/* Post Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-divine rounded-full flex items-center justify-center text-lg">
                      {post.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">
                        {post.author}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={12} />
                        {post.time}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      post.type === "announcement"
                        ? "bg-blue-100 text-blue-700"
                        : post.type === "milestone"
                        ? "bg-green-100 text-green-700"
                        : post.type === "question"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {post.type}
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-foreground text-sm mb-3 leading-relaxed">
                  {post.content}
                </p>

                {/* Post Image if exists */}
                {post.image && (
                  <div className="w-full h-32 bg-gradient-divine/10 rounded-xl mb-4 flex items-center justify-center text-4xl">
                    {post.image}
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Heart size={16} />
                      <span className="text-xs">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Share2 size={16} />
                      <span className="text-xs">{post.shares}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "events" && (
          <div className="space-y-4">
            {mockEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-divine"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-divine rounded-xl flex items-center justify-center text-2xl">
                    {event.image}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {event.title}
                    </h3>
                    <div className="text-sm text-muted-foreground mb-2">
                      {event.date} at {event.time}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users size={12} />
                      {event.participants} participating
                    </div>
                  </div>
                  <button className="btn-divine text-sm py-2 px-4">Join</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-4">
            {members.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-divine"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-divine rounded-full flex items-center justify-center text-lg">
                      {member.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {member.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.role}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.followers} followers
                      </div>
                    </div>
                  </div>
                  <button className="btn-temple text-sm py-2 px-4">
                    Follow
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </InnerPageWrapper>
  );
};

export default Community;
