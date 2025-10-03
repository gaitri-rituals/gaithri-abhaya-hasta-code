import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation files
const resources = {
  en: {
    translation: {
      // Onboarding
      'onboarding.welcome': 'Welcome to Divine Temple',
      'onboarding.step1.title': 'Spiritual Journey Begins',
      'onboarding.step1.description': 'Connect with your inner peace through our divine temple experience',
      'onboarding.step2.title': 'Sacred Services',
      'onboarding.step2.description': 'Access blessed offerings, ceremonies, and spiritual guidance',
      'onboarding.step3.title': 'Community of Faith',
      'onboarding.step3.description': 'Join thousands of devotees in prayer and celebration',
      'onboarding.skip': 'Skip',
      'onboarding.next': 'Next',
      'onboarding.finish': 'Begin Journey',

      // Authentication
      'auth.login.title': 'Enter Sacred Grounds',
      'auth.login.subtitle': 'Please sign in to access divine services',
      'auth.login.email': 'Email Address',
      'auth.login.phone': 'Phone Number',
      'auth.login.continue': 'Continue',
      'auth.otp.title': 'Verification',
      'auth.otp.subtitle': 'Enter the sacred code sent to your device',
      'auth.otp.resend': 'Resend Code',
      'auth.otp.back': 'Back',
      'auth.otp.verify': 'Verify',

      // Navigation
      'nav.home': 'Home',
      'nav.class': 'Classes',
      'nav.store': 'Store',
      'nav.community': 'Community',
      'nav.profile': 'Profile',

      // Address
      'address.title': 'Select Address',
      'address.current': 'Use Current Location',
      'address.search': 'Search for address...',
      'address.recent': 'Recent Addresses',
      'address.saved': 'Saved Addresses',

      // General
      'common.loading': 'Loading...',
      'common.error': 'An error occurred',
      'common.retry': 'Retry',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
    }
  },
  hi: {
    translation: {
      // Onboarding
      'onboarding.welcome': 'दिव्य मंदिर में आपका स्वागत है',
      'onboarding.step1.title': 'आध्यात्मिक यात्रा शुरू',
      'onboarding.step1.description': 'हमारे दिव्य मंदिर अनुभव के माध्यम से अपनी आंतरिक शांति से जुड़ें',
      'onboarding.step2.title': 'पवित्र सेवाएं',
      'onboarding.step2.description': 'धन्य प्रसाद, समारोह और आध्यात्मिक मार्गदर्शन का लाभ उठाएं',
      'onboarding.step3.title': 'आस्था का समुदाय',
      'onboarding.step3.description': 'प्रार्थना और उत्सव में हजारों भक्तों के साथ शामिल हों',
      'onboarding.skip': 'छोड़ें',
      'onboarding.next': 'आगे',
      'onboarding.finish': 'यात्रा शुरू करें',

      // Authentication
      'auth.login.title': 'पवित्र भूमि में प्रवेश',
      'auth.login.subtitle': 'दिव्य सेवाओं तक पहुंचने के लिए कृपया साइन इन करें',
      'auth.login.email': 'ईमेल पता',
      'auth.login.phone': 'फोन नंबर',
      'auth.login.continue': 'जारी रखें',

      // Navigation
      'nav.home': 'होम',
      'nav.class': 'कक्षाएं',
      'nav.store': 'स्टोर',
      'nav.community': 'समुदाय',
      'nav.profile': 'प्रोफाइल',
    }
  },
  // Add more languages as needed
};

export const initI18n = () => {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });

  return i18n;
};

export default i18n;