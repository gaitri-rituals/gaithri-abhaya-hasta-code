import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator && 'production' === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-simple.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById("root")).render(<App />);