import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Star, Clock, Users, MapPin, Book, Trophy, Gift } from 'lucide-react';
import { templeClasses, gurus } from '../data/templeClasses';
import { saveEnrollmentDraft, getEnrollmentDraft, clearEnrollmentDraft } from '../utils/localStorage';
import useBasketStore from '../store/basketStore';
import { toast } from 'sonner';

const ClassEnrollmentStepper = ({ step = 1 }) => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const { addToBasket } = useBasketStore();
  const [currentStep, setCurrentStep] = useState(parseInt(step));
  const [enrollmentData, setEnrollmentData] = useState({});
  const [classData, setClassData] = useState(null);
  const [guruData, setGuruData] = useState(null);

  useEffect(() => {
    // Load class and guru data
    const classInfo = templeClasses.find(c => c.id === classId);
    if (classInfo) {
      setClassData(classInfo);
      const guru = gurus.find(g => g.id === classInfo.guruId);
      setGuruData(guru);
      
      // Load draft data
      const draft = getEnrollmentDraft();
      if (draft && draft.classId === classId) {
        setEnrollmentData(draft);
      }
    }
  }, [classId]);

  const updateEnrollmentData = (newData) => {
    const updated = { ...enrollmentData, ...newData, classId };
    setEnrollmentData(updated);
    saveEnrollmentDraft(updated);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
    } else {
      navigate('/classes');
    }
  };

  const handleAddToBasket = async () => {
    if (!enrollmentData.selectedPlan) {
      toast.error('Please select a subscription plan');
      return;
    }

    const basketItem = {
      type: 'class_subscription',
      classId: classData.id,
      title: classData.title,
      guru: guruData.name,
      temple: classData.temple,
      plan: enrollmentData.selectedPlan,
      level: enrollmentData.selectedLevel,
      kit: classData.kit,
      price: enrollmentData.selectedPlan.price,
      image: classData.image
    };

    await addToBasket(basketItem);
    clearEnrollmentDraft();
    toast.success('Class added to basket!');
    navigate('/basket');
  };

  if (!classData || !guruData) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10">
        <div className="flex items-center justify-between p-4">
          <button onClick={handleBack} className="flex items-center gap-2 text-muted-foreground">
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="font-semibold text-foreground">{classData.title}</h1>
          <div className="w-16" />
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-center pb-4">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepNum <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {stepNum < currentStep ? <Check size={16} /> : stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`w-16 h-1 ${
                  stepNum < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-4"
      >
        {currentStep === 1 && <Step1 classData={classData} guruData={guruData} />}
        {currentStep === 2 && (
          <Step2 
            classData={classData} 
            enrollmentData={enrollmentData}
            updateEnrollmentData={updateEnrollmentData}
          />
        )}
        {currentStep === 3 && (
          <Step3 
            classData={classData} 
            enrollmentData={enrollmentData}
            updateEnrollmentData={updateEnrollmentData}
          />
        )}
      </motion.div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="flex gap-4">
          {currentStep < 3 ? (
            <button 
              onClick={handleNext}
              className="flex-1 btn-divine flex items-center justify-center gap-2"
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button 
              onClick={handleAddToBasket}
              className="flex-1 btn-divine flex items-center justify-center gap-2"
            >
              Add to Basket <Gift size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Step 1: Meet the Guru
const Step1 = ({ classData, guruData }) => (
  <div className="space-y-6 pb-20">
    {/* Guru Profile */}
    <div className="card-divine text-center">
      <div className="text-6xl mb-4">{guruData.photo}</div>
      <h2 className="text-xl font-bold text-foreground mb-2">{guruData.name}</h2>
      <p className="text-primary font-medium mb-2">{guruData.specialization}</p>
      <p className="text-muted-foreground text-sm mb-4">{guruData.experience} years of experience</p>
      
      <div className="flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <MapPin size={14} />
          {guruData.temple}
        </div>
        <div className="flex items-center gap-1">
          <Trophy size={14} />
          {guruData.lineage}
        </div>
        <div className="flex items-center gap-1">
          <Star size={14} className="text-yellow-500 fill-current" />
          {guruData.rating}
        </div>
      </div>
    </div>

    {/* Bio */}
    <div className="card-divine">
      <h3 className="font-semibold text-foreground mb-3">About Your Guru</h3>
      <p className="text-muted-foreground leading-relaxed">{guruData.bio}</p>
    </div>

    {/* Testimonials */}
    <div className="card-divine">
      <h3 className="font-semibold text-foreground mb-4">What Students Say</h3>
      <div className="space-y-4">
        {guruData.testimonials.map((testimonial, index) => (
          <div key={index} className="bg-muted/50 rounded-lg p-4">
            <p className="text-muted-foreground italic mb-2">"{testimonial.text}"</p>
            <p className="text-sm font-medium text-foreground">- {testimonial.student}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Temple Blessing */}
    <div className="card-divine bg-gradient-divine text-white text-center">
      <div className="text-4xl mb-3">{classData.image}</div>
      <h3 className="font-bold mb-2">Learn Under Divine Blessings</h3>
      <p className="text-sm opacity-90">
        Receive the blessings of {classData.deity} at {classData.temple}
      </p>
    </div>
  </div>
);

// Step 2: Program Details
const Step2 = ({ classData, enrollmentData, updateEnrollmentData }) => (
  <div className="space-y-6 pb-20">
    {/* Schedule */}
    <div className="card-divine">
      <h3 className="font-semibold text-foreground mb-4">Class Schedule</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Schedule</p>
            <p className="font-medium">{classData.schedule}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Batch Size</p>
            <p className="font-medium">Max {classData.batchSize} students</p>
          </div>
        </div>
      </div>
    </div>

    {/* Level Selection */}
    <div className="card-divine">
      <h3 className="font-semibold text-foreground mb-4">Choose Your Level</h3>
      <div className="grid gap-3">
        {classData.level.map((level) => (
          <button
            key={level}
            onClick={() => updateEnrollmentData({ selectedLevel: level })}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              enrollmentData.selectedLevel === level
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <p className="font-medium">{level}</p>
            <p className="text-sm text-muted-foreground">
              {level === 'Beginner' && 'No prior experience needed'}
              {level === 'Intermediate' && 'Some basic knowledge required'}
              {level === 'Advanced' && 'For experienced practitioners'}
            </p>
          </button>
        ))}
      </div>
    </div>

    {/* Curriculum */}
    <div className="card-divine">
      <h3 className="font-semibold text-foreground mb-4">Learning Journey</h3>
      <div className="space-y-3">
        {classData.curriculum.map((item, index) => (
          <div key={index} className="flex gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-primary">{index + 1}</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Week {item.week}</p>
              <p className="text-sm text-muted-foreground">{item.topic}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Divine Blessing Highlight */}
    <div className="card-divine bg-gradient-divine text-white">
      <Book className="w-8 h-8 mb-3" />
      <h3 className="font-bold mb-2">Sacred Learning Environment</h3>
      <p className="text-sm opacity-90">
        All classes are conducted within the temple premises, creating a spiritually enriching learning atmosphere where ancient wisdom meets modern teaching methods.
      </p>
    </div>
  </div>
);

// Step 3: Fees & Subscription
const Step3 = ({ classData, enrollmentData, updateEnrollmentData }) => (
  <div className="space-y-6 pb-20">
    {/* Subscription Plans */}
    <div className="card-divine">
      <h3 className="font-semibold text-foreground mb-4">Choose Your Plan</h3>
      <div className="space-y-3">
        {classData.subscriptionPlans.map((plan) => (
          <button
            key={plan.duration}
            onClick={() => updateEnrollmentData({ selectedPlan: plan })}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              enrollmentData.selectedPlan?.duration === plan.duration
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold capitalize">{plan.duration} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {plan.duration === 'yearly' && 'Most Popular - Save 33%'}
                  {plan.duration === 'quarterly' && 'Good Value - Save 15%'}
                  {plan.duration === 'monthly' && 'Flexible Option'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">₹{plan.price}</p>
                {plan.originalPrice > plan.price && (
                  <p className="text-sm text-muted-foreground line-through">₹{plan.originalPrice}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>

    {/* Kit Details */}
    <div className="card-divine">
      <h3 className="font-semibold text-foreground mb-4">Included Learning Kit</h3>
      <div className="bg-muted/50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-foreground mb-2">{classData.kit.name}</h4>
        <p className="text-sm text-muted-foreground mb-3">Worth ₹{classData.kit.value}</p>
        <div className="grid grid-cols-2 gap-2">
          {classData.kit.items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check size={14} className="text-green-600" />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Digital Access */}
    <div className="card-divine">
      <h3 className="font-semibold text-foreground mb-4">Digital Access Included</h3>
      <div className="grid grid-cols-2 gap-2">
        {classData.digitalAccess.map((access, index) => (
          <div key={index} className="flex items-center gap-2">
            <Check size={14} className="text-primary" />
            <span className="text-sm">{access}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Summary */}
    {enrollmentData.selectedPlan && (
      <div className="card-divine bg-gradient-divine text-white">
        <h3 className="font-bold mb-3">Enrollment Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Class:</span>
            <span>{classData.title}</span>
          </div>
          <div className="flex justify-between">
            <span>Level:</span>
            <span>{enrollmentData.selectedLevel || 'Not selected'}</span>
          </div>
          <div className="flex justify-between">
            <span>Plan:</span>
            <span className="capitalize">{enrollmentData.selectedPlan.duration}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-white/20 pt-2">
            <span>Total:</span>
            <span>₹{enrollmentData.selectedPlan.price}</span>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default ClassEnrollmentStepper;