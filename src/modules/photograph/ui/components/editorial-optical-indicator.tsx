'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface OpticalIndicatorPhoto {
  id: string;
  title?: string | null;
  focalLength?: number | null;
  fNumber?: number | null;
  iso?: number | null;
}

interface EditorialOpticalIndicatorProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  photos?: OpticalIndicatorPhoto[];
  fadeDelayMs?: number;
}

/**
 * EditorialOpticalIndicator (Scroll Progress)
 *
 * An ultra-subtle, minimal scroll progress line anchored to the left edge of the screen:
 * - 1px wide on mobile devices, 2px wide on desktop.
 * - Tiny 1px horizontal hairline leading marker protruding at the progress tip.
 * - Darker, subdued color tones for minimal distraction.
 * - Understated idle dimming during reading.
 * - Interactive click-to-scrub zone on desktop while preserving native edge-swipe gestures on mobile.
 */
export function EditorialOpticalIndicator({
  containerRef,
  fadeDelayMs = 250,
}: EditorialOpticalIndicatorProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafId = useRef<number | null>(null);

  const calculateProgress = useCallback(() => {
    const container = containerRef?.current;
    const windowHeight = window.innerHeight;

    if (container) {
      const rect = container.getBoundingClientRect();
      const hasEntered = rect.top < windowHeight * 0.9;
      const hasExited = rect.bottom < windowHeight * 0.1;
      setIsVisible(hasEntered && !hasExited);

      const totalScrollable = rect.height - windowHeight;
      if (totalScrollable > 0) {
        const scrolled = -rect.top;
        const progress = Math.min(1, Math.max(0, scrolled / totalScrollable));
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
    } else {
      const total =
        document.documentElement.scrollHeight - windowHeight;
      const progress =
        total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      setIsVisible(window.scrollY > 50);
      setScrollProgress(progress);
    }
  }, [containerRef]);

  const handleScroll = useCallback(() => {
    if (rafId.current !== null) return;

    rafId.current = window.requestAnimationFrame(() => {
      rafId.current = null;
      calculateProgress();

      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, fadeDelayMs);
    });
  }, [calculateProgress, fadeDelayMs]);

  useEffect(() => {
    const handleResize = () => {
      calculateProgress();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    calculateProgress();

    return () => {
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleScroll, calculateProgress]);

  const handleDesktopScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.min(
      1,
      Math.max(0, (e.clientY - rect.top) / rect.height),
    );

    const container = containerRef?.current;
    if (container) {
      const windowHeight = window.innerHeight;
      const containerTop =
        container.getBoundingClientRect().top + window.scrollY;
      const totalScrollable = container.scrollHeight - windowHeight;
      const targetY = containerTop + clickRatio * Math.max(0, totalScrollable);
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    } else {
      const total =
        document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: clickRatio * total, behavior: 'smooth' });
    }
  };

  return (
    <aside
      aria-label='Story-Fortschritt'
      className={cn(
        'fixed left-0 top-0 bottom-0 h-screen z-40 select-none pointer-events-none',
        'transition-opacity duration-300 ease-out',
        isVisible
          ? isScrolling
            ? 'opacity-65 md:opacity-55'
            : 'opacity-20 md:opacity-15 hover:opacity-65'
          : 'opacity-0',
      )}
    >
      {/* Interactive desktop scrub zone (wider hit target, pointer-events enabled) */}
      <div
        onClick={handleDesktopScrub}
        className='hidden md:block absolute left-0 top-0 bottom-0 w-3 h-full cursor-pointer pointer-events-auto'
        title={`Fortschritt: ${Math.round(scrollProgress * 100)}%`}
      />

      {/* Ultra-subtle track line along left edge (1px mobile, 2px desktop) */}
      <div className='relative h-full w-[1px] md:w-[2px] bg-foreground/[0.04] dark:bg-white/[0.05]'>
        {/* Active progress fill line with darker, muted tone */}
        <div
          className='w-full bg-foreground/30 dark:bg-foreground/35 transition-[height] duration-75 ease-out'
          style={{
            height: `${Math.min(100, Math.max(0, scrollProgress * 100))}%`,
          }}
        />

        {/* Tiny horizontal line leading marker at progress tip */}
        <div
          className='absolute left-0 -translate-y-1/2 transition-[top] duration-75 ease-out pointer-events-none'
          style={{
            top: `${Math.min(100, Math.max(0, scrollProgress * 100))}%`,
          }}
        >
          <span className='block h-[1px] w-2 md:w-3 bg-foreground/50 dark:bg-white/45' />
        </div>
      </div>
    </aside>
  );
}
