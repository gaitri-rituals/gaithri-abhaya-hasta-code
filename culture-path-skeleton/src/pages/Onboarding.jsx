import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../state/store";
import {
  ChevronRight,
  SkipForward,
  Sparkles,
  Users,
  Heart,
} from "lucide-react";
import DivineBackground from "../components/ui/divineBackground";

const onboardingSteps = [
  {
    id: 1,
    icon: Sparkles,
    titleKey: "onboarding.step1.title",
    descriptionKey: "onboarding.step1.description",
    gradient: "from-primary to-primary-glow",
  },
  {
    id: 2,
    icon: Heart,
    titleKey: "onboarding.step2.title",
    descriptionKey: "onboarding.step2.description",
    gradient: "from-secondary to-accent",
  },
  {
    id: 3,
    icon: Users,
    titleKey: "onboarding.step3.title",
    descriptionKey: "onboarding.step3.description",
    gradient: "from-accent to-sacred",
  },
];

const Onboarding = () => {
  const { t } = useTranslation();
  const { completeOnboarding } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const currentStepData = onboardingSteps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-temple flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 relative z-10">
        <motion.h1
          className="text-2xl font-bold text-gradient-divine"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {t("onboarding.welcome")}
        </motion.h1>

        <motion.button
          onClick={handleSkip}
          className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SkipForward size={16} />
          {t("onboarding.skip")}
        </motion.button>
      </div>

      {/* Progress Indicator */}
      <div className="px-6 mb-8 relative z-10">
        <div className="flex gap-2">
          {onboardingSteps.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                index <= currentStep ? "bg-primary" : "bg-border"
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="text-center max-w-sm w-full"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Icon */}
            <motion.div
              className={`w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-r ${currentStepData.gradient} 
                         flex items-center justify-center shadow-divine`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
            >
              <IconComponent size={40} className="text-white" />
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-3xl font-bold text-foreground mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {t(currentStepData.titleKey)}
            </motion.h2>

            {/* Description */}
            <motion.p
              className="text-lg text-muted-foreground leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              {t(currentStepData.descriptionKey)}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="p-6 pb-8 relative z-10">
        <motion.button
          onClick={handleNext}
          className="btn-divine w-full flex items-center justify-center gap-2 text-lg py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {currentStep === onboardingSteps.length - 1
            ? t("onboarding.finish")
            : t("onboarding.next")}
          <ChevronRight size={20} />
        </motion.button>
      </div>
      <DivineBackground />
    </div>
  );
};

export default Onboarding;
