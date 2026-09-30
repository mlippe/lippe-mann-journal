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
  const [hasCompleted, setHasCompleted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Immediate display if user prefers reduced motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true);
      setHasCompleted(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    let timer: NodeJS.Timeout;
    let completionTimer: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (delayMs > 0) {
            timer = setTimeout(() => {
              setIsVisible(true);
              completionTimer = setTimeout(() => setHasCompleted(true), 750);
            }, delayMs);
          } else {
            setIsVisible(true);
            completionTimer = setTimeout(() => setHasCompleted(true), 750);
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
      if (timer) clearTimeout(timer);
      if (completionTimer) clearTimeout(completionTimer);
    };
  }, [delayMs]);

  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        'transition-[opacity,transform] duration-700 ease-out',
        !hasCompleted && 'will-change-[opacity,transform]',
        isVisible
          ? hasCompleted
            ? 'opacity-100'
            : 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-5',
        className,
      )}
    >
      {children}
    </div>
  );
};
