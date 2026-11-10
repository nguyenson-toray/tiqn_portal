import React, { useRef, useState, useCallback, useEffect } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const THRESHOLD = 60;
const MAX_PULL = 80;

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const refreshingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  refreshingRef.current = refreshing;

  /** Update indicator + content transform via DOM (no React re-render) */
  const applyPull = useCallback((distance: number) => {
    pullDistanceRef.current = distance;
    const indicator = indicatorRef.current;
    const content = contentRef.current;
    if (indicator) {
      indicator.style.height = `${distance}px`;
      indicator.style.opacity = distance > 0 ? "1" : "0";
      // Rotate arrow when past threshold
      const arrow = indicator.querySelector("svg");
      if (arrow) {
        arrow.style.transform = distance >= THRESHOLD ? "rotate(180deg)" : "rotate(0deg)";
      }
    }
    if (content) {
      content.style.transform = distance > 0 ? `translateY(0)` : "";
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current;
    if (el && el.scrollTop <= 0 && !refreshingRef.current) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || refreshingRef.current) return;
      const delta = e.touches[0].clientY - touchStartY.current;
      if (delta > 0 && el.scrollTop <= 0) {
        e.preventDefault();
        applyPull(Math.min(delta * 0.4, MAX_PULL));
      } else if (delta < 0) {
        isPulling.current = false;
        applyPull(0);
      }
    };

    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [applyPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistanceRef.current >= THRESHOLD && !refreshingRef.current) {
      setRefreshing(true);
      applyPull(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        applyPull(0);
      }
    } else {
      applyPull(0);
    }
  }, [onRefresh, applyPull]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className || ""}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator — height driven by DOM, not state */}
      <div
        ref={indicatorRef}
        className="flex items-center justify-center overflow-hidden"
        style={{ height: refreshing ? THRESHOLD : 0, opacity: refreshing ? 1 : 0, transition: "height 150ms" }}
      >
        {refreshing ? (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: "transform 200ms" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </div>
      <div ref={contentRef}>{children}</div>
    </div>
  );
};

export default PullToRefresh;
