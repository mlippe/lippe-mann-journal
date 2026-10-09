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
 * scales (vernier indices, depth-of-field markings) and Swiss Graphic Design.
 *
 * - Integrated seamlessly into the right edge of the screen (desktop and mobile).
 * - Strictly monochrome / B&W: lines, ticks, and Swiss typography only.
 * - Idle dimming to remain non-distracting during editorial reading.
 * - Interactive tap/click navigation to smoothly scroll between story photographs.
 */
interface PhotoGeometry {
  index: number;
  element: HTMLElement;
  effectiveCenter: number;
}

/**
 * Calculates accurate vertical sightline coordinates for all story photographs.
 * For side-by-side pairs (diptychs), assigns staggered vertical zones (first half
 * for photo A, second half for photo B) so scroll progress advances monotonically
 * without jumping back and forth or oscillating due to aspect ratio differences.
 */
function getPhotoGeometries(container: HTMLElement): PhotoGeometry[] {
  const elements = container.querySelectorAll<HTMLElement>(
    '[data-story-photo-index]',
  );

  const rawItems: {
    index: number;
    element: HTMLElement;
    rect: DOMRect;
    effectiveCenter: number;
  }[] = [];

  elements.forEach((el) => {
    const rawIdx = el.getAttribute('data-story-photo-index');
    if (rawIdx !== null) {
      const index = Number(rawIdx);
      if (!isNaN(index)) {
        const rect = el.getBoundingClientRect();
        rawItems.push({
          index,
          element: el,
          rect,
          effectiveCenter: rect.top + rect.height * 0.5,
        });
      }
    }
  });

  // Sort strictly by narrative index
  rawItems.sort((a, b) => a.index - b.index);

  // Detect side-by-side pairs (diptychs) and calibrate effective centers
  for (let i = 0; i < rawItems.length - 1; i++) {
    const a = rawItems[i];
    const b = rawItems[i + 1];

    if (b.index === a.index + 1) {
      const verticalOverlap =
        Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      const minHeight = Math.min(a.rect.height, b.rect.height);
      const isSideBySide =
        minHeight > 0 &&
        verticalOverlap > minHeight * 0.35 &&
        Math.abs(a.rect.left - b.rect.left) > 40;

      if (isSideBySide) {
        const combinedTop = Math.min(a.rect.top, b.rect.top);
        const combinedBottom = Math.max(a.rect.bottom, b.rect.bottom);
        const combinedHeight = Math.max(1, combinedBottom - combinedTop);

        // First half corresponds to photo A (left), second half to photo B (right)
        a.effectiveCenter = combinedTop + combinedHeight * 0.25;
        b.effectiveCenter = combinedTop + combinedHeight * 0.75;

        i++; // advance past b
      }
    }
  }

  return rawItems;
}

export function EditorialOpticalIndicator({
  containerRef,
  photos,
}: EditorialOpticalIndicatorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafId = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    if (rafId.current !== null) return;

    rafId.current = window.requestAnimationFrame(() => {
      rafId.current = null;
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Only reveal once the story enters the viewport and hide when exited
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
      const geometries = getPhotoGeometries(container);

      let closestIndex = 0;
      let minDistance = Infinity;

      geometries.forEach((g) => {
        const dist = Math.abs(g.effectiveCenter - sightline);
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = g.index;
        }
      });

      if (closestIndex >= 0 && closestIndex < photos.length) {
        setActiveIndex(closestIndex);
      }

      // Mark scrolling active and set idle timeout
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1800);
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
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  const scrollToPhoto = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container) return;

      const windowHeight = window.innerHeight;
      const sightline = windowHeight * 0.45;
      const geometries = getPhotoGeometries(container);
      const target = geometries.find((g) => g.index === index);

      if (target) {
        const delta = target.effectiveCenter - sightline;
        window.scrollBy({ top: delta, behavior: 'smooth' });
      } else {
        const fallback = container.querySelector<HTMLElement>(
          `[data-story-photo-index="${index}"]`,
        );
        if (fallback) {
          fallback.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    [containerRef],
  );

  // Only display for multi-photo stories
  if (photos.length < 2) {
    return null;
  }

  return (
    <aside
      aria-label='Fotostrecken-Index'
      className={cn(
        'fixed right-0 top-1/2 -translate-y-1/2 z-30 select-none pointer-events-auto',
        'transition-all duration-300 ease-out',
        isVisible
          ? 'translate-x-0'
          : 'translate-x-2 pointer-events-none opacity-0',
        isVisible &&
          (isScrolling
            ? 'opacity-100'
            : 'opacity-35 hover:opacity-100 focus-within:opacity-100'),
      )}
    >
      <div className='flex flex-col items-end py-2 pl-3 md:pl-4 pr-0'>
        {/* Top Header: Swiss Frame Tag (Desktop only) */}
        <span className='hidden md:block text-[9px] font-mono tracking-[0.2em] uppercase text-foreground/40 tabular-nums select-none pr-1.5 pb-1'>
          FRM
        </span>

        {/* Precision Optical Rail & Ticks */}
        <div className='relative flex flex-col items-end py-1'>
          {/* Vertical Hairline Axis (Integrated into right edge) */}
          <span
            aria-hidden='true'
            className='absolute right-0 top-0 bottom-0 w-[1px] bg-foreground/15 pointer-events-none'
          />

          {/* Continuous Scroll Progress Hairline Fill */}
          <span
            aria-hidden='true'
            className='absolute right-0 top-0 w-[1px] md:w-[1.5px] bg-foreground/75 transition-[height] duration-75 ease-out pointer-events-none'
            style={{
              height: `${Math.min(100, Math.max(0, scrollProgress * 100))}%`,
            }}
          />

          {/* Photo Frame Ticks */}
          {photos.map((photo, idx) => {
            const isActive = idx === activeIndex;
            const metadata = [
              photo.focalLength ? `${photo.focalLength}mm` : null,
              photo.fNumber ? `f/${photo.fNumber}` : null,
            ]
              .filter(Boolean)
              .join(' · ');

            return (
              <button
                key={photo.id || idx}
                type='button'
                onClick={() => scrollToPhoto(idx)}
                className='relative flex items-center justify-end pl-4 md:pl-5 pr-0 h-5 sm:h-6 md:h-7 group cursor-pointer focus:outline-hidden touch-manipulation'
                aria-label={`Foto ${idx + 1} von ${photos.length}`}
              >
                {/* Desktop Hover Flyout (Pure B&W Lens Metadata) */}
                <span className='hidden md:flex absolute right-full mr-2.5 px-2 py-0.5 rounded-xs bg-foreground text-background text-[10px] font-mono tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-md z-40 items-center gap-1.5'>
                  <span className='font-bold'>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  {metadata && (
                    <>
                      <span className='opacity-30'>|</span>
                      <span className='opacity-80'>{metadata}</span>
                    </>
                  )}
                </span>

                {/* Active Frame Numerals (Desktop only) */}
                <span
                  className={cn(
                    'hidden md:inline font-mono tabular-nums tracking-widest text-foreground select-none transition-all duration-200 text-[10px]',
                    isActive
                      ? 'opacity-100 translate-x-0 mr-2 font-semibold'
                      : 'opacity-0 translate-x-1 pointer-events-none w-0 overflow-hidden mr-0',
                  )}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>

                {/* Optical Notch / Tick (Flush to right-0) */}
                <span
                  className={cn(
                    'block rounded-l-xs transition-all duration-200',
                    isActive
                      ? 'w-3.5 md:w-7 h-[1.5px] md:h-[2px] bg-foreground'
                      : 'w-1.5 md:w-3.5 h-[1px] bg-foreground/30 group-hover:w-2.5 group-hover:md:w-5 group-hover:bg-foreground/75',
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* Bottom Total Frame Count (Desktop only) */}
        <span className='hidden md:block text-[9px] font-mono tracking-[0.16em] uppercase text-foreground/35 tabular-nums select-none pr-1.5 pt-1'>
          /{String(photos.length).padStart(2, '0')}
        </span>
      </div>
    </aside>
  );
}
