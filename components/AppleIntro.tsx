import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GREETINGS = [
  "Hello",      // English
  "Namaste",    // Hindi
  "Hola",       // Spanish
  "Bonjour",    // French
  "Ciao",       // Italian
  "こんにちは",  // Japanese
  "안녕하세요",  // Korean
  "你好",       // Chinese
];

export default function AppleIntro() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // If we've shown all greetings, hide the intro
    if (currentIndex >= GREETINGS.length) {
      setTimeout(() => setShowIntro(false), 300);
      return;
    }

    // Change greeting every 800ms for a slower, smoother effect
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 800);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  if (!showIntro) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="apple-intro"
        initial={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "-100%" }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xl overflow-hidden cursor-pointer select-none"
        onClick={() => setShowIntro(false)}
        title="Click anywhere to skip"
      >
        <AnimatePresence mode="wait">
          {currentIndex < GREETINGS.length && (
            <motion.h1
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="text-5xl md:text-8xl font-extrabold text-white tracking-tight drop-shadow-2xl"
            >
              {GREETINGS[currentIndex]}
            </motion.h1>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
