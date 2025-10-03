import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { X, Check, Globe } from "lucide-react";
import { useAppStore } from "../state/store";

const languages = [
  { code: "en", name: "English", native: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳" },
];

const LanguageSelector = ({ onClose }) => {
  const { i18n } = useTranslation();
  const { currentLanguage, setLanguage } = useAppStore();

  const handleLanguageSelect = (langCode) => {
    setLanguage(langCode);
    i18n.changeLanguage(langCode);
    onClose();
  };

  return (
    
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-divine rounded-full flex items-center justify-center">
                <Globe size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Select Language
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred language
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Language List */}
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {languages.map((language, index) => (
                <motion.button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg text-left transition-all
                            ${
                              currentLanguage === language.code
                                ? "bg-primary/10 border-2 border-primary/20"
                                : "hover:bg-muted border-2 border-transparent"
                            }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: index * 0.02 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Flag and Language Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{language.flag}</span>
                    <div>
                      <div className="font-medium text-foreground">
                        {language.native}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language.name}
                      </div>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {currentLanguage === language.code && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                    >
                      <Check size={14} className="text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 pt-2 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              More languages coming soon. Help us translate by contacting
              support.
            </p>
          </div>
        </>
      
     
  );
};

export default LanguageSelector;
