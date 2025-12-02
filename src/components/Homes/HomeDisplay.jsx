import { useEffect, useRef, useState } from "react";


const images = [
  "https://picsum.photos/id/1018/1200/600",
  "https://picsum.photos/id/1025/1200/600",
  "https://picsum.photos/id/1037/1200/600",
];

const AUTO_PLAY_MS = 3000;
const DRAG_THRESHOLD = 50;

const HomeDisplay = () => {
  // we create clones: [lastClone, ...images, firstClone]
  const total = images.length;
  const [index, setIndex] = useState(1); // start at first real slide (1)
  const [isTransitioning, setIsTransitioning] = useState(true);
  const sliderRef = useRef(null);
  const autoplayRef = useRef(null);

  // Drag state
  const drag = useRef({
    startX: 0,
    currentX: 0,
    dragging: false,
    moved: false,
  });

  // Set up autoplay
  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function startAutoplay() {
    stopAutoplay();
    autoplayRef.current = setInterval(() => {
      goNext();
    }, AUTO_PLAY_MS);
  }
  function stopAutoplay() {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }

  // Reset autoplay after user interaction
  const resetAutoplay = () => {
    stopAutoplay();
    startAutoplay();
  };

  // Move helpers
  const goNext = () => {
    if (isTransitioning) {
      setIndex((i) => i + 1);
      setIsTransitioning(true);
    }
  };
  const goPrev = () => {
    if (isTransitioning) {
      setIndex((i) => i - 1);
      setIsTransitioning(true);
    }
  };

  // Transition end: fix jump when on cloned slides
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleTransitionEnd = () => {
      // if we moved to the cloned first (index === total + 1) -> snap to real first (1)
      if (index === total + 1) {
        setIsTransitioning(false); // remove transition for the jump
        setIndex(1);
        // allow next render to re-enable transition:
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsTransitioning(true));
        });
      }

      // if we moved to cloned last (index === 0) -> snap to real last (total)
      if (index === 0) {
        setIsTransitioning(false);
        setIndex(total);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsTransitioning(true));
        });
      }
    };

    slider.addEventListener("transitionend", handleTransitionEnd);
    return () => slider.removeEventListener("transitionend", handleTransitionEnd);
  }, [index, total]);

  // Drag / swipe handlers (pointer events)
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    const onPointerDown = (e) => {
      drag.current.dragging = true;
      drag.current.startX = e.clientX ?? e.touches?.[0]?.clientX;
      drag.current.currentX = drag.current.startX;
      drag.current.moved = false;
      // pause transition while dragging
      el.style.transition = "none";
      stopAutoplay();
    };

    const onPointerMove = (e) => {
      if (!drag.current.dragging) return;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      drag.current.currentX = clientX;
      const delta = drag.current.currentX - drag.current.startX;
      // move the slider by delta
      const width = el.clientWidth;
      const translate = -index * width + delta;
      el.style.transform = `translateX(${translate}px)`;
      drag.current.moved = Math.abs(delta) > 5;
    };

    const onPointerUp = (e) => {
      if (!drag.current.dragging) return;
      drag.current.dragging = false;
      const delta = drag.current.currentX - drag.current.startX;
      // restore transition
      el.style.transition = "";
      if (Math.abs(delta) > DRAG_THRESHOLD) {
        if (delta < 0) {
          // swiped left -> next
          setIndex((i) => i + 1);
        } else {
          // swiped right -> prev
          setIndex((i) => i - 1);
        }
      } else {
        // snap back to current
        setIndex((i) => i);
      }
      resetAutoplay();
    };

    // Support mouse + touch
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // also support touch events fallback (older devices)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // keyboard left/right support
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // compute transform
  const getTransform = () => {
    // slider container width is 100% (we translate by index * width)
    return `translateX(${-index * 100}%)`;
  };

  // click handlers for controls
  const handleNextClick = () => {
    stopAutoplay();
    goNext();
    resetAutoplay();
  };
  const handlePrevClick = () => {
    stopAutoplay();
    goPrev();
    resetAutoplay();
  };

  // render clones
  const slides = [
    images[total - 1], // last clone first
    ...images,
    images[0], // first clone last
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-2 px-4">
      <div className="relative">
        {/* Slider viewport */}
        <div className="overflow-hidden rounded-xl">
          {/* Slider track */}
          <div
            ref={sliderRef}
            className="flex will-change-transform"
            style={{
              width: `${slides.length * 100}%`,
              transform: getTransform(),
              transition: isTransitioning ? "transform 400ms cubic-bezier(.22,.9,.25,1)" : "none",
            }}
            // prevent images from being draggable by browser default
            onDragStart={(e) => e.preventDefault()}
          >
            {slides.map((src, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-full"
                style={{ width: `${100 / slides.length * slides.length}%` }} // each slide 100% of viewport
              >
                <div className="w-full h-64 md:h-96 bg-gray-100 flex items-center justify-center">
                  <img
                    src={src}
                    alt={`slide-${i}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Left/Right controls */}
        <button
          onClick={handlePrevClick}
          aria-label="Previous"
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.293 15.707a1 1 0 010-1.414L15.586 11H5a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" transform="rotate(180 12 8)"/>
          </svg>
        </button>

        <button
          onClick={handleNextClick}
          aria-label="Next"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.293 15.707a1 1 0 010-1.414L15.586 11H5a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd"/>
          </svg>
        </button>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-3">
          {images.map((_, i) => {
            const pageIndex = i + 1; // because our real slides start at 1
            const active = index === pageIndex || (index === 0 && pageIndex === total) || (index === total + 1 && pageIndex === 1);
            return (
              <button
                key={i}
                onClick={() => {
                  stopAutoplay();
                  setIndex(i + 1);
                  resetAutoplay();
                }}
                className={`w-2 h-2 rounded-full ${active ? "bg-blue-600" : "bg-gray-300"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomeDisplay;
