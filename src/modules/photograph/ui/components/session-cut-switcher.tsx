'use client';

import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SessionCutSwitcherProps {
  activeCut: 'revisited' | 'initial';
  onCutChange: (cut: 'revisited' | 'initial') => void;
  hasRevisitedCut: boolean;
  initialCount: number;
  revisitedCount: number;
  revisitedNote?: string | null;
  revisitedAt?: Date | string | null;
  className?: string;
}

export const SessionCutSwitcher = ({
  activeCut,
  onCutChange,
  hasRevisitedCut,
  initialCount,
  revisitedCount,
  revisitedNote,
  revisitedAt,
  className,
}: SessionCutSwitcherProps) => {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Cut Toggle Controls */}
      <div className='flex items-center gap-2 flex-wrap'>
        {hasRevisitedCut ? (
          <div className='inline-flex items-center p-1 rounded-full bg-muted/60 border border-border/60 text-xs font-mono backdrop-blur-xs'>
            {/* Revisited Cut Tab (Red Marker) */}
            <button
              type='button'
              onClick={() => onCutChange('revisited')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-200 cursor-pointer',
                activeCut === 'revisited'
                  ? 'bg-background text-red-500 font-semibold shadow-xs ring-1 ring-red-500/30'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className='size-2 rounded-full bg-red-500 shrink-0' />
              <span>Revisited Cut ({revisitedCount})</span>
            </button>

            {/* Initial Gut Cut Tab (Yellow Marker) */}
            <button
              type='button'
              onClick={() => onCutChange('initial')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-200 cursor-pointer',
                activeCut === 'initial'
                  ? 'bg-background text-amber-500 font-semibold shadow-xs ring-1 ring-amber-500/30'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className='size-2 rounded-full bg-amber-400 shrink-0' />
              <span>Initial Cut ({initialCount})</span>
            </button>
          </div>
        ) : (
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-600 dark:text-amber-400'>
            <span className='size-2 rounded-full bg-amber-400 shrink-0' />
            <span>Initial Selection · {initialCount} Frames</span>
          </div>
        )}
      </div>

      {/* Retrospective Reflection Note */}
      {hasRevisitedCut && activeCut === 'revisited' && revisitedNote && (
        <blockquote className='border-l-2 border-red-500/40 pl-3.5 py-0.5 text-xs sm:text-sm text-muted-foreground italic font-sans max-w-2xl'>
          &ldquo;{revisitedNote}&rdquo;
          {revisitedAt && (
            <span className='block text-[11px] not-italic font-mono text-muted-foreground/60 mt-1'>
              Revisited im{' '}
              {format(new Date(revisitedAt), 'MMMM yyyy', { locale: de })}
            </span>
          )}
        </blockquote>
      )}
    </div>
  );
};
