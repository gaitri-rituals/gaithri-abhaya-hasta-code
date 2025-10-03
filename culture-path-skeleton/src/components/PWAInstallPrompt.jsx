import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";

export default function PWAInstallPrompt({ appName = document.title }) {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState(null);
  const [iosHint, setIosHint] = useState(false);

  // ---- Detect iOS/Safari ---------------------------------------------------
  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIos =
      /iphone|ipad|ipod/i.test(ua) && !window.MSStream && !window.matchMedia("(display-mode: standalone)").matches;
    setIosHint(isIos);
  }, []);

  // ---- Capture beforeinstallprompt -----------------------------------------
  useEffect(() => {
    let t;
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);

      const last = Number(localStorage.getItem("pwa-install-dismissed") || 0);
      const days = (Date.now() - last) / (1000 * 60 * 60 * 24);

      if (days > 3) {
        t = setTimeout(() => setVisible(true), 2500);
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  // ---- Handlers ------------------------------------------------------------
  const handleInstall = useCallback(async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    console.info(`PWA install ${outcome}`);
    setDeferred(null);
    setVisible(false);
  }, [deferred]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  }, []);

  // ---- UI ------------------------------------------------------------------
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              aria-label="Close install prompt"
              onClick={handleDismiss}
              className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100"
            >
              <X size={20} />
            </button>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-lg"
            >
              <Smartphone size={28} />
            </motion.div>

            {/* Title & Text */}
            <h3 className="mb-2 text-center text-xl font-bold text-gray-900">
              Install <span className="text-orange-500">{appName}</span>
            </h3>

            {iosHint ? (
              <p className="mb-6 text-center text-sm text-gray-600">
                On iPhone/iPad, tap the <strong>Share</strong> icon and choose{" "}
                <strong>Add to Home Screen</strong> for a quick-launch app.
              </p>
            ) : (
              <p className="mb-6 text-center text-sm text-gray-600">
                Quick access to prayers, ceremonies, and spiritual guidance —
                straight from your home screen.
              </p>
            )}

            {!iosHint && (
              <div className="flex gap-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 py-2 font-medium text-white hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Install
                </button>
              </div>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
              <div>
                <div className="font-medium text-orange-500">Offline</div>
                Works without internet
              </div>
              <div>
                <div className="font-medium text-orange-500">Fast</div>
                Instant loading
              </div>
              <div>
                <div className="font-medium text-orange-500">Native</div>
                App-like feel
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
