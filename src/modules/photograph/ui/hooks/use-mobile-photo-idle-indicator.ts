'use client';

import { useEffect, useRef, useState } from 'react';

interface UseMobilePhotoIdleIndicatorOptions {
  /**
   * Ref to the container holding the photo elements with [data-story-photo-index].
   */
  containerRef: React.RefObject<HTMLElement | null>;
  /**
   * Time in milliseconds of scroll inactivity before showing the indicator.
   * Default: 2500ms (2.5 seconds)
   */
  idleDelayMs?: number;
  /**
   * Attribute name on photo elements.
   * Default: 'data-story-photo-index'
   */
  attributeName?: string;
  /**
   * Intersection threshold (how much of the photo must be visible).
   * Default: 0.3 (30%)
   */
  threshold?: number;
  /**
   * Dependency to re-bind observer when photos or layout change.
   */
  deps?: unknown[];
}

/**
 * High-performance hook for mobile devices to show fullscreen photo indicators
 * after 2.5s of scroll inactivity.
 *
 * Performance characteristics:
 * - 0% desktop overhead: exits immediately if the device supports native hover.
 * - Zero layout thrashing: uses a single IntersectionObserver off the main thread.
 * - Zero React re-renders while scrolling: observer updates a ref, not state.
 * - Single passive window scroll listener with exactly 1 debounced timer.
 */
export function useMobilePhotoIdleIndicator({
  containerRef,
  idleDelayMs = 2500,
  attributeName = 'data-story-photo-index',
  threshold = 0.3,
  deps = [],
}: UseMobilePhotoIdleIndicatorOptions) {
  const [idlePhotoIndices, setIdlePhotoIndices] = useState<Set<number>>(
    () => new Set(),
  );
  const visibleIndicesRef = useRef<Set<number>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isShowingRef = useRef(false);

  useEffect(() => {
    // Only activate on touch / mobile devices that lack native hover capability
    if (typeof window === 'undefined') return;

    const hasFineHover = window.matchMedia(
      '(hover: hover) and (pointer: fine)',
    ).matches;
    if (hasFineHover) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // 1. Single IntersectionObserver: tracks which photos are in viewport in the background
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const rawIdx = entry.target.getAttribute(attributeName);
          if (rawIdx !== null) {
            const idx = Number(rawIdx);
            if (entry.isIntersecting) {
              visibleIndicesRef.current.add(idx);
            } else {
              visibleIndicesRef.current.delete(idx);
              // If a photo leaves the viewport while active, remove it
              setIdlePhotoIndices((prev) => {
                if (prev.has(idx)) {
                  const next = new Set(prev);
                  next.delete(idx);
                  return next;
                }
                return prev;
              });
            }
          }
        });
      },
      {
        threshold,
      },
    );

    const elements = container.querySelectorAll(`[${attributeName}]`);
    elements.forEach((el) => observer.observe(el));

    // 2. Idle callback when no scroll has occurred for idleDelayMs
    const onIdle = () => {
      if (visibleIndicesRef.current.size > 0) {
        isShowingRef.current = true;
        setIdlePhotoIndices(new Set(visibleIndicesRef.current));
      }
    };

    // 3. Single passive scroll listener
    const onScroll = () => {
      // Immediately fade out indicators when user resumes scrolling
      if (isShowingRef.current) {
        isShowingRef.current = false;
        setIdlePhotoIndices(new Set());
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(onIdle, idleDelayMs);
    };

    // Initial check (in case user opens story and looks at hero without scrolling)
    timerRef.current = setTimeout(onIdle, idleDelayMs);

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, idleDelayMs, attributeName, threshold, ...deps]);

  return idlePhotoIndices;
}
