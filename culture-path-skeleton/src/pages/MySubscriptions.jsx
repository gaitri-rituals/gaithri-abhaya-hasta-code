import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Play, 
  Trophy, 
  Calendar, 
  Clock,
  Star,
  FireExtinguisherIcon,
  Target,
  Gift,
  ChevronRight
} from 'lucide-react';
import InnerPageWrapper from '../components/InnerPageWrapper';
import { getClassSubscriptions, getLearningProgress, getDailyStreaks } from '../utils/localStorage';
import { templeClasses, gurus, dailyLearningModules } from '../data/templeClasses';

const MySubscriptions = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const userSubscriptions = getClassSubscriptions();
    const enrichedSubscriptions = userSubscriptions.map(sub => {
      const classData = templeClasses.find(c => c.id === sub.classId);
      const guruData = gurus.find(g => g.id === classData?.guruId);
      const progress = getLearningProgress(sub.id);
      const streaks = getDailyStreaks(sub.id);
      
      return {
        ...sub,
        classData,
        guruData,
        progress,
        streaks
      };
    });
    setSubscriptions(enrichedSubscriptions);
  }, []);

  const handleBackClick = () => {
    navigate('/');
  };

  if (subscriptions.length === 0) {
    return (
      <InnerPageWrapper title="My Classes" onBackClick={handleBackClick}>
        <div className="p-4">
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Classes Yet</h3>
            <p className="text-muted-foreground mb-6">Start your spiritual learning journey today</p>
            <button 
              onClick={() => navigate('/classes')}
              className="btn-divine"
            >
              Explore Classes
            </button>
          </div>
        </div>
      </InnerPageWrapper>
    );
  }

  return (
    <InnerPageWrapper title="My Classes" onBackClick={handleBackClick}>
      <div className="p-4">
        {/* Tabs */}
        <div className="flex bg-muted rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'learning' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground'
            }`}
          >
            Daily Learning
          </button>
        </div>

        {activeTab === 'overview' && <OverviewTab subscriptions={subscriptions} />}
        {activeTab === 'learning' && <LearningTab subscriptions={subscriptions} />}
      </div>
    </InnerPageWrapper>
  );
};

const OverviewTab = ({ subscriptions }) => {
  const totalProgress = subscriptions.reduce((acc, sub) => acc + sub.progress.completedModules.length, 0);
  const totalStreaks = subscriptions.reduce((acc, sub) => acc + sub.streaks.currentStreak, 0);
  const totalPoints = subscriptions.reduce((acc, sub) => acc + sub.progress.totalPoints, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-divine text-center">
          <FireExtinguisherIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-foreground">{totalStreaks}</div>
          <div className="text-xs text-muted-foreground">Day Streak</div>
        </div>
        <div className="card-divine text-center">
          <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-foreground">{totalProgress}</div>
          <div className="text-xs text-muted-foreground">Lessons Done</div>
        </div>
        <div className="card-divine text-center">
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-lg font-bold text-foreground">{totalPoints}</div>
          <div className="text-xs text-muted-foreground">Points Earned</div>
        </div>
      </div>

      {/* Active Subscriptions */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Active Classes</h3>
        {subscriptions.map((subscription, index) => (
          <motion.div
            key={subscription.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card-divine"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-divine rounded-lg flex items-center justify-center text-xl">
                {subscription.classData.image}
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{subscription.classData.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  with {subscription.guruData.name}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {subscription.classData.schedule}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {subscription.classData.duration}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{subscription.progress.completedModules.length} modules</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all duration-300"
                      style={{ width: `${Math.min((subscription.progress.completedModules.length / 30) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <FireExtinguisherIcon size={14} className="text-orange-500" />
                      <span className="text-sm font-medium">{subscription.streaks.currentStreak}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500" />
                      <span className="text-sm font-medium">{subscription.progress.totalPoints}</span>
                    </div>
                  </div>
                  
                  <button className="text-primary text-sm font-medium flex items-center gap-1">
                    View Details
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Upcoming Classes */}
      <div className="card-divine bg-gradient-divine text-white">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Next Class
        </h3>
        {subscriptions.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">{subscriptions[0].classData.title}</p>
            <p className="text-sm opacity-90">
              {subscriptions[0].classData.schedule} at {subscriptions[0].classData.temple}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const LearningTab = ({ subscriptions }) => {
  const [selectedSubscription, setSelectedSubscription] = useState(subscriptions[0]);

  if (!selectedSubscription) return null;

  const todayModules = dailyLearningModules[selectedSubscription.classId] || [];
  const todayModule = todayModules[0]; // For demo, showing first module

  return (
    <div className="space-y-6">
      {/* Class Selector */}
      {subscriptions.length > 1 && (
        <div className="card-divine">
          <h3 className="font-semibold text-foreground mb-3">Select Class</h3>
          <div className="grid gap-2">
            {subscriptions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubscription(sub)}
                className={`p-3 rounded-lg text-left transition-colors ${
                  selectedSubscription.id === sub.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{sub.classData.image}</span>
                  <span className="font-medium">{sub.classData.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Daily Learning Journey */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Today's Learning Journey</h3>
        
        {todayModule ? (
          <>
            {/* Step 1: Knowledge Story */}
            <DailyLearningCard
              step={1}
              title="Knowledge Story"
              subtitle={todayModule.knowledgeStory.title}
              icon="📚"
              content={todayModule.knowledgeStory.content}
              isCompleted={false}
            />

            {/* Step 2: Practice Time */}
            <DailyLearningCard
              step={2}
              title="Practice Session"
              subtitle={todayModule.practiceSession.title}
              icon="🎯"
              content={`${todayModule.practiceSession.duration} min practice session`}
              isCompleted={false}
            />

            {/* Step 3: Interactive Quiz */}
            <DailyLearningCard
              step={3}
              title="Interactive Quiz"
              subtitle="Test Your Knowledge"
              icon="🧠"
              content={todayModule.quiz.question}
              isCompleted={false}
            />
          </>
        ) : (
          <div className="card-divine text-center py-8">
            <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold text-foreground mb-2">Content Coming Soon</h4>
            <p className="text-muted-foreground text-sm">
              Daily learning modules will be available once your classes begin
            </p>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <div className="card-divine bg-gradient-divine text-white">
        <h3 className="font-bold mb-3">Your Progress</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">{selectedSubscription.streaks.currentStreak}</div>
            <div className="text-sm opacity-90">Day Streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{selectedSubscription.progress.totalPoints}</div>
            <div className="text-sm opacity-90">Total Points</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DailyLearningCard = ({ step, title, subtitle, icon, content, isCompleted }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`card-divine border-l-4 ${isCompleted ? 'border-green-500' : 'border-primary'}`}
  >
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
        isCompleted ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'
      }`}>
        {isCompleted ? '✓' : step}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{icon}</span>
          <h4 className="font-semibold text-foreground">{title}</h4>
        </div>
        <p className="text-primary font-medium mb-2">{subtitle}</p>
        <p className="text-muted-foreground text-sm mb-4">{content}</p>
        
        <button className={`btn-divine text-sm py-2 px-4 flex items-center gap-2 ${
          isCompleted ? 'opacity-50' : ''
        }`} disabled={isCompleted}>
          <Play size={14} />
          {isCompleted ? 'Completed' : 'Start Learning'}
        </button>
      </div>
    </div>
  </motion.div>
);

export default MySubscriptions;