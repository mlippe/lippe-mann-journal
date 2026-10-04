'use client';

import { useEffect, useRef, useState } from 'react';

interface UseNavScrollCollapseOptions {
  disabled?: boolean;
  downThreshold?: number;
  upThreshold?: number;
  topThreshold?: number;
}

/**
 * Custom hook to detect meaningful downward scroll intention to collapse the navigation UI,
 * and immediately restore it upon upward scroll intention.
 */
export function useNavScrollCollapse({
  disabled = false,
  downThreshold = 45,
  upThreshold = 15,
  topThreshold = 30,
}: UseNavScrollCollapseOptions = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastScrollY = useRef(0);
  const accumulatedDown = useRef(0);
  const accumulatedUp = useRef(0);

  useEffect(() => {
    if (disabled) {
      accumulatedDown.current = 0;
      accumulatedUp.current = 0;
      return;
    }

    lastScrollY.current = window.scrollY;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY.current;

          // Always show navigation when near or at the top of the page
          if (currentScrollY <= topThreshold) {
            setIsCollapsed(false);
            accumulatedDown.current = 0;
            accumulatedUp.current = 0;
            lastScrollY.current = Math.max(0, currentScrollY);
            ticking = false;
            return;
          }

          // Ignore overscroll bounce at top (< 0) or beyond document height
          const maxScrollY =
            document.documentElement.scrollHeight - window.innerHeight;
          if (currentScrollY < 0 || (maxScrollY > 0 && currentScrollY > maxScrollY)) {
            lastScrollY.current = currentScrollY;
            ticking = false;
            return;
          }

          if (delta > 0) {
            // Scrolling DOWN: reset upward tracker, accumulate downward motion
            accumulatedUp.current = 0;
            accumulatedDown.current += delta;

            if (accumulatedDown.current >= downThreshold) {
              setIsCollapsed(true);
            }
          } else if (delta < 0) {
            // Scrolling UP: reset downward tracker, accumulate upward motion
            accumulatedDown.current = 0;
            accumulatedUp.current += Math.abs(delta);

            if (accumulatedUp.current >= upThreshold) {
              setIsCollapsed(false);
            }
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [disabled, downThreshold, upThreshold, topThreshold]);

  return disabled ? false : isCollapsed;
}
