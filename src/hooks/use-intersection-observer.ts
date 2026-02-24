'use client';

import { useCallback, useRef } from 'react';

interface UseIntersectionObserverProps {
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
}

export const useIntersectionObserver = ({
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: UseIntersectionObserverProps) => {
  const observer = useRef<IntersectionObserver>(null);
  
  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage],
  );

  return { lastElementRef };
};
