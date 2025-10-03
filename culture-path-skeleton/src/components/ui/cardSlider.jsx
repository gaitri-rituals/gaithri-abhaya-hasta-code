import { useState, useEffect, Children, useRef } from "react";
import { motion } from "framer-motion";

/**
 * CardSlider
 * <CardSlider auto interval={4000} pauseOnHover>
 *   <div>Your Slide</div>
 *   ...
 * </CardSlider>
 */
export default function CardSlider({
  children,
  auto = true,
  interval = 4000,
  pauseOnHover = true,
}) {
  const slides = Children.toArray(children);
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const timer = useRef(null);
  const container = useRef(null);

  // auto advance
  useEffect(() => {
    if (!auto || total <= 1) return;
    const start = () => {
      timer.current = setInterval(
        () => setIndex((i) => (i + 1) % total),
        interval
      );
    };
    start();
    return () => clearInterval(timer.current);
  }, [auto, interval, total]);

  const pause = () => pauseOnHover && clearInterval(timer.current);
  const resume = () => pauseOnHover && auto && (timer.current = setInterval(() => setIndex((i) => (i + 1) % total), interval));

  return (
    <div
      ref={container}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
      className="relative w-full overflow-hidden"
    >
      <motion.div
        className="flex"
        style={{ width: `${100 * total}%` }}
        animate={{ x: `-${index * 100}%` }}
        transition={{
          duration: 0.9,
          ease: [0.22, 0.61, 0.36, 1], // iOS-like cubic-bezier
        }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="w-full flex-shrink-0 flex justify-center">
            {slide}
          </div>
        ))}
      </motion.div>

      {/* dots */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 w-5 rounded-full transition-colors duration-300
              ${i === index ? "bg-white/80" : "bg-white/20"}`}
          />
        ))}
      </div>
    </div>
  );
}
