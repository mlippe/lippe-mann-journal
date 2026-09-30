'use client';

import { useQueryState, parseAsString } from 'nuqs';
import { cn } from '@/lib/utils';
import { IconLayoutGrid, IconBook2 } from '@tabler/icons-react';

interface FeedViewSwitcherProps {
  className?: string;
  totalPosts?: number;
}

export const FeedViewSwitcher = ({
  className,
  totalPosts,
}: FeedViewSwitcherProps) => {
  const [view, setView] = useQueryState(
    'view',
    parseAsString.withDefault('zine'),
  );

  return (
    <div
      className={cn(
        'flex items-center justify-center pt-2 pb-6 -mx-3 px-3 md:mx-0 md:px-0 border-b border-border/40',
        className,
      )}
    >
      <div className='flex items-center gap-1 bg-muted/60 p-0.5 rounded-full border border-border/50'>
        <button
          onClick={() => setView('zine')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer',
            view === 'zine'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-label='Magazin Ansicht'
        >
          <IconBook2 className='size-3.5' />
          <span>Magazin</span>
        </button>
        <button
          onClick={() => setView('grid')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer',
            view === 'grid'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-label='Übersicht Raster Ansicht'
        >
          <IconLayoutGrid className='size-3.5' />
          <span>Übersicht</span>
        </button>
      </div>
    </div>
  );
};
