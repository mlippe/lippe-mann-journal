'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

export const ScrollReveal = ({
  children,
  className,
  delayMs = 0,
  ...props
}: ScrollRevealProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Immediate display if user prefers reduced motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (delayMs > 0) {
            const timer = setTimeout(() => setIsVisible(true), delayMs);
            return () => clearTimeout(timer);
          } else {
            setIsVisible(true);
          }
          observer.disconnect();
        }
      },
      {
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.05,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [delayMs]);

  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        'transition-[opacity,transform] duration-700 ease-out will-change-[opacity,transform]',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
        className,
      )}
    >
      {children}
    </div>
  );
};
