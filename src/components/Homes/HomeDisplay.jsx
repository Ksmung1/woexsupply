import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const images = [
  "https://i.pinimg.com/1200x/36/9f/6f/369f6f9d06575f4d0629f4f8bf8347f8.jpg",
  "https://i.pinimg.com/1200x/e6/b9/c1/e6b9c1decfae8e63c78edf62d1328f3f.jpg",
  "https://i.pinimg.com/736x/4a/6f/1d/4a6f1d0c21f1e9a4f697816720dc002b.jpg"
];

const AUTO_PLAY_MS = 5000;
const DRAG_THRESHOLD = 50;

const HomeDisplay = () => {
  const { isDark } = useTheme();
  const total = images.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoplayRef = useRef(null);
  const containerRef = useRef(null);

  // Drag state
  const drag = useRef({
    startX: 0,
    currentX: 0,
    dragging: false,
  });

  // Autoplay
  useEffect(() => {
    stopAutoplay();
    if (isTransitioning) return;
    
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => (prev + 1) % total);
      setTimeout(() => setIsTransitioning(false), 600);
    }, AUTO_PLAY_MS);
    
    autoplayRef.current = timer;
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentIndex, isTransitioning, total]);

  const stopAutoplay = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  };

  const resetAutoplay = () => {
    stopAutoplay();
    setTimeout(() => {
      if (!isTransitioning) {
        autoplayRef.current = setInterval(() => goNext(), AUTO_PLAY_MS);
      }
    }, 100);
  };

  const goNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % total);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const goPrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const goToSlide = (idx) => {
    if (isTransitioning || idx === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(idx);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  // Drag handlers
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerDown = (e) => {
      drag.current.dragging = true;
      drag.current.startX = e.clientX ?? e.touches?.[0]?.clientX;
      stopAutoplay();
    };

    const onPointerMove = (e) => {
      if (!drag.current.dragging) return;
      drag.current.currentX = e.clientX ?? e.touches?.[0]?.clientX;
    };

    const onPointerUp = () => {
      if (!drag.current.dragging) return;
      const delta = drag.current.currentX - drag.current.startX;
      drag.current.dragging = false;
      
      if (Math.abs(delta) > DRAG_THRESHOLD) {
        if (delta < 0) goNext();
        else goPrev();
      }
      resetAutoplay();
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    el.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, []);

  // Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") {
        stopAutoplay();
        goPrev();
        resetAutoplay();
      }
      if (e.key === "ArrowRight") {
        stopAutoplay();
        goNext();
        resetAutoplay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Get slide positions for 3D carousel
  const getSlidePosition = (slideIndex) => {
    let position = slideIndex - currentIndex;
    if (position > total / 2) position -= total;
    if (position < -total / 2) position += total;
    return position;
  };

  const getSlideStyle = (position) => {
    const isActive = position === 0;
    const absPos = Math.abs(position);

    if (isActive) {
      // Center slide - fully visible
      return {
        transform: "translateZ(0px) scale(1)",
        zIndex: 10,
        opacity: 1,
      };
    } else if (position < 0) {
      // Left side slide - behind and scaled
      const translateX = -absPos * 35;
      const translateZ = -absPos * 250;
      const scale = 1 - absPos * 0.25;
      return {
        transform: `translateX(${translateX}%) translateZ(${translateZ}px) scale(${scale})`,
        zIndex: 10 - absPos,
        opacity: Math.max(0.5, 0.8 - absPos * 0.3),
      };
    } else {
      // Right side slide - behind and scaled
      const translateX = position * 35;
      const translateZ = -position * 250;
      const scale = 1 - position * 0.25;
      return {
        transform: `translateX(${translateX}%) translateZ(${translateZ}px) scale(${scale})`,
        zIndex: 10 - position,
        opacity: Math.max(0.5, 0.8 - position * 0.3),
      };
    }
  };

  return (
    <div className="w-full py-3 pb-0 md:py-5">
      {/* Mobile: Simple slider */}
      <div className="md:hidden relative">
        <div className="overflow-hidden rounded-2xl shadow-xl">
          <div 
            className="flex" 
            style={{ 
              transform: `translateX(-${currentIndex * 100}%)`, 
              transition: isTransitioning ? "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" : "none" 
            }}
          >
            {images.map((src, i) => (
              <div key={i} className="w-full flex-shrink-0">
                <div className="w-full h-[200px] bg-gray-100 overflow-hidden">
                  <img src={src} alt={`slide-${i}`} className="w-full h-full object-cover" draggable={false} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => { stopAutoplay(); goPrev(); resetAutoplay(); }}
          className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 shadow-lg z-10 ${isDark ? "bg-gray-800/90 hover:bg-gray-800" : "bg-white/90 hover:bg-white"}`}
          aria-label="Previous"
        >
          <FaChevronLeft className={isDark ? "text-white" : "text-gray-800"} />
        </button>
        <button
          onClick={() => { stopAutoplay(); goNext(); resetAutoplay(); }}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 shadow-lg z-10 ${isDark ? "bg-gray-800/90 hover:bg-gray-800" : "bg-white/90 hover:bg-white"}`}
          aria-label="Next"
        >
<FaChevronRight className={isDark ? "text-white" : "text-gray-800"} />
        </button>
      </div>

      {/* Desktop: 3D Carousel */}
      <div className="hidden md:block relative w-full max-w-5xl mx-auto" ref={containerRef}>
        <div
          className="relative h-[400px] lg:h-[280px] w-full"
          style={{
            perspective: "1500px",
            perspectiveOrigin: "50% 50%",
          }}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {images.map((src, i) => {
              const position = getSlidePosition(i);
              const style = getSlideStyle(position);
              const isVisible = Math.abs(position) <= 1;

              if (!isVisible) return null;

              return (
                <div
                  key={i}
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  style={{
                    ...style,
                    transition: isTransitioning
                      ? "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.7s ease"
                      : "none",
                    transformOrigin: "center center",
                    willChange: "transform, opacity",
                  }}
                  onClick={() => {
                    if (position !== 0) {
                      stopAutoplay();
                      goToSlide(i);
                      resetAutoplay();
                    }
                  }}
                >
                  <div className="w-4/5 h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                    <img
                      src={src}
                      alt={`slide-${i}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={() => { stopAutoplay(); goPrev(); resetAutoplay(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-200 z-20 group"
          aria-label="Previous"
        >
          <FaChevronLeft className="text-gray-800 text-xl group-hover:text-purple-600 transition-colors" />
        </button>
        <button
          onClick={() => { stopAutoplay(); goNext(); resetAutoplay(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-200 z-20 group"
          aria-label="Next"
        >
          <FaChevronRight className="text-gray-800 text-xl group-hover:text-purple-600 transition-colors" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-2">
        {images.map((_, i) => {
          const isActive = i === currentIndex;
          return (
            <button
              key={i}
              onClick={() => {
                stopAutoplay();
                goToSlide(i);
                resetAutoplay();
              }}
              className={`rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 w-8 h-2.5"
                  : "bg-gray-300 hover:bg-gray-400 w-2.5 h-2.5"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default HomeDisplay;
