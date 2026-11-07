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
}

/**
 * EditorialOpticalIndicator (Scroll Progress)
 *
 * A super subtle, modern UI scroll progress line anchored to the left edge of the screen:
 * - 2px wide on mobile devices, 4px wide on desktop.
 * - Gentle progress fill from top to bottom matching scroll depth through the editorial story.
 * - Precision modern UI front marker at the leading edge showing continuous progress.
 * - Understated idle dimming to stay completely non-intrusive during reading.
 * - Interactive click-to-scrub on desktop while preserving native edge-swipe gestures on mobile.
 */
export function EditorialOpticalIndicator({
  containerRef,
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
      }, 1500);
    });
  }, [calculateProgress]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

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
        'fixed left-0 top-0 bottom-0 h-screen z-40 select-none',
        'transition-opacity duration-300 pointer-events-none',
        isVisible
          ? isScrolling
            ? 'opacity-90'
            : 'opacity-30 md:opacity-40 hover:opacity-100'
          : 'opacity-0',
      )}
    >
      {/* Interactive desktop scrub zone (wider hit target, pointer-events enabled) */}
      <div
        onClick={handleDesktopScrub}
        className='hidden md:block absolute left-0 top-0 bottom-0 w-4 h-full cursor-pointer pointer-events-auto group'
        title={`Fortschritt: ${Math.round(scrollProgress * 100)}%`}
      />

      {/* Subtle track line along left edge */}
      <div className='relative h-full w-[2px] md:w-[4px] bg-foreground/[0.06] dark:bg-white/[0.08]'>
        {/* Active progress fill line */}
        <div
          className='w-full bg-foreground/45 dark:bg-foreground/55 transition-[height] duration-75 ease-out rounded-b-[1px]'
          style={{
            height: `${Math.min(100, Math.max(0, scrollProgress * 100))}%`,
          }}
        />

        {/* Tiny modern UI front marker at the progress tip */}
        <div
          className='absolute left-0 -translate-y-1/2 transition-[top] duration-75 ease-out pointer-events-none flex items-center'
          style={{
            top: `${Math.min(100, Math.max(0, scrollProgress * 100))}%`,
          }}
        >
          <div
            className={cn(
              'rounded-r-xs bg-foreground shadow-xs',
              'transition-transform duration-200',
              // Dimensions: 2px track -> 5px marker on mobile; 4px track -> 8px marker on desktop
              'w-[5px] h-[13px] md:w-[8px] md:h-[18px]',
              isScrolling && 'scale-y-110',
            )}
          />
        </div>
      </div>
    </aside>
  );
}
