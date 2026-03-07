import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); setShowBanner(true); setTimeout(() => setShowBanner(false), 3000); };
    const onOffline = () => { setIsOnline(false); setShowBanner(true); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-1.5 text-xs font-medium ${
            isOnline ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {isOnline ? (
            <><Wifi className="h-3.5 w-3.5" /> Conexão restaurada</>
          ) : (
            <><WifiOff className="h-3.5 w-3.5" /> Sem conexão — modo offline</>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
