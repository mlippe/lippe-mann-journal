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
  containerRef: React.RefObject<HTMLElement | null>;
  photos: OpticalIndicatorPhoto[];
}

/**
 * EditorialOpticalIndicator
 *
 * An optical scroll progress and frame indicator inspired by manual camera lens
 * scales (Leica / Hasselblad depth-of-field indices) and Swiss Graphic Design.
 *
 * - Desktop: Precision hairline ticks with active frame index, Leica red reference dot,
 *   photo lens metadata on hover, and smooth click-to-scroll navigation.
 * - Mobile: Discreet floating glass pill with active frame counter and micro-progress gauge.
 */
export function EditorialOpticalIndicator({
  containerRef,
  photos,
}: EditorialOpticalIndicatorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const rafId = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    if (rafId.current !== null) return;

    rafId.current = window.requestAnimationFrame(() => {
      rafId.current = null;
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Only reveal once the story enters the viewport and hide when deep in footer
      const hasEntered = rect.top < windowHeight * 0.75;
      const hasExited = rect.bottom < windowHeight * 0.2;
      setIsVisible(hasEntered && !hasExited);

      // Continuous progress through the container
      const totalScrollable = Math.max(1, rect.height - windowHeight * 0.5);
      const scrolled = -rect.top + windowHeight * 0.25;
      const progress = Math.min(1, Math.max(0, scrolled / totalScrollable));
      setScrollProgress(progress);

      // Find photo element closest to vertical sightline (45% from viewport top)
      const sightline = windowHeight * 0.45;
      const elements = container.querySelectorAll<HTMLElement>(
        '[data-story-photo-index]',
      );

      let closestIndex = 0;
      let minDistance = Infinity;

      elements.forEach((el) => {
        const elRect = el.getBoundingClientRect();
        const elCenter = elRect.top + elRect.height * 0.5;
        const dist = Math.abs(elCenter - sightline);
        const rawIdx = el.getAttribute('data-story-photo-index');
        if (rawIdx !== null && dist < minDistance) {
          minDistance = dist;
          closestIndex = Number(rawIdx);
        }
      });

      if (closestIndex >= 0 && closestIndex < photos.length) {
        setActiveIndex(closestIndex);
      }
    });
  }, [containerRef, photos.length]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  const scrollToPhoto = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container) return;
      const target = container.querySelector<HTMLElement>(
        `[data-story-photo-index="${index}"]`,
      );
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [containerRef],
  );

  const scrollToNext = useCallback(() => {
    const nextIdx = (activeIndex + 1) % photos.length;
    scrollToPhoto(nextIdx);
  }, [activeIndex, photos.length, scrollToPhoto]);

  // Only display for multi-photo stories
  if (photos.length < 2) {
    return null;
  }

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
       * DESKTOP: Swiss Precision Optical Scale (Fixed Right Rail)
       * ───────────────────────────────────────────────────────────── */}
      <aside
        aria-label='Fotostrecken-Index'
        className={cn(
          'hidden md:flex fixed right-3 lg:right-6 xl:right-8 top-1/2 -translate-y-1/2 z-30 flex-col items-end select-none pointer-events-auto transition-all duration-400 ease-out',
          isVisible
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-3 pointer-events-none',
        )}
      >
        <div className='flex flex-col items-end gap-1 p-2 bg-background/70 dark:bg-background/50 backdrop-blur-md rounded-md border border-border/30 shadow-xs'>
          {/* Swiss Top Label (Exposure Frame Header) */}
          <div className='flex items-center gap-1.5 pb-1 border-b border-border/30 w-full justify-end pr-0.5'>
            <span className='size-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)] shrink-0' />
            <span className='text-[9px] font-mono tracking-[0.16em] uppercase text-muted-foreground/75 font-semibold tabular-nums'>
              EXP
            </span>
          </div>

          {/* Optical Ticks with Leica Reference Dot & Numerals */}
          <div className='relative flex flex-col items-end py-1'>
            {photos.map((photo, idx) => {
              const isActive = idx === activeIndex;
              const metadata = [
                photo.focalLength ? `${photo.focalLength}mm` : null,
                photo.fNumber ? `f/${photo.fNumber}` : null,
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <div
                  key={photo.id || idx}
                  onClick={() => scrollToPhoto(idx)}
                  className='relative flex items-center justify-end py-1 px-0.5 group cursor-pointer'
                  title={`Foto ${idx + 1}`}
                >
                  {/* Tooltip on hover (appears to the left) */}
                  <div className='absolute right-full mr-2.5 px-2 py-0.5 rounded-xs bg-foreground text-background text-[10px] font-mono tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-md z-40 flex items-center gap-1.5'>
                    <span className='font-bold text-red-400'>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {metadata && (
                      <>
                        <span className='opacity-30'>|</span>
                        <span className='opacity-90'>{metadata}</span>
                      </>
                    )}
                  </div>

                  {/* Active Indicator & Number */}
                  <div
                    className={cn(
                      'flex items-center gap-1.5 mr-2 transition-all duration-200',
                      isActive
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 translate-x-2 pointer-events-none',
                    )}
                  >
                    <span className='text-[10px] font-mono font-bold tracking-wider tabular-nums text-foreground'>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className='size-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] shrink-0' />
                  </div>

                  {/* Optical Scale Hairline Tick */}
                  <span
                    className={cn(
                      'block h-[1px] rounded-full transition-all duration-200',
                      isActive
                        ? 'w-5 bg-foreground'
                        : 'w-2.5 bg-muted-foreground/35 group-hover:w-4 group-hover:bg-foreground/75',
                    )}
                  />
                </div>
              );
            })}
          </div>

          {/* Bottom Total Frame Count */}
          <div className='pt-1 border-t border-border/30 w-full flex justify-end pr-0.5'>
            <span className='text-[9px] font-mono tracking-[0.14em] uppercase text-muted-foreground/60 tabular-nums font-medium'>
              / {String(photos.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
       * MOBILE: Ultra-Discreet Floating Frame Pill (Bottom-Right)
       * ───────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex md:hidden fixed bottom-5 right-4 z-30 select-none transition-all duration-300 pointer-events-auto',
          isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-3 pointer-events-none',
        )}
      >
        <button
          onClick={scrollToNext}
          className='backdrop-blur-md bg-background/90 dark:bg-background/80 border border-border/40 shadow-sm rounded-full py-1.5 px-3 flex items-center gap-2 active:scale-95 transition-transform cursor-pointer'
          aria-label={`Foto ${activeIndex + 1} von ${photos.length} (Tippen für nächstes Foto)`}
        >
          <span className='size-1.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_6px_rgba(239,68,68,0.6)]' />
          <span className='text-[11px] font-mono tracking-widest tabular-nums text-foreground font-medium'>
            {String(activeIndex + 1).padStart(2, '0')} /{' '}
            {String(photos.length).padStart(2, '0')}
          </span>
          {/* Micro Progress Bar */}
          <span className='w-5 h-[2px] bg-muted rounded-full overflow-hidden shrink-0'>
            <span
              className='block h-full bg-red-500 transition-all duration-200'
              style={{ width: `${Math.round(scrollProgress * 100)}%` }}
            />
          </span>
        </button>
      </div>
    </>
  );
}
