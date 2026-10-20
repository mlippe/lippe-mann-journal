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
            {/* Revisited Cut Tab */}
            <button
              type='button'
              onClick={() => onCutChange('revisited')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-200 cursor-pointer',
                activeCut === 'revisited'
                  ? 'bg-background text-foreground font-semibold shadow-xs ring-1 ring-border/80'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span>Revisited Cut ({revisitedCount})</span>
            </button>

            {/* Initial Gut Cut Tab */}
            <button
              type='button'
              onClick={() => onCutChange('initial')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-200 cursor-pointer',
                activeCut === 'initial'
                  ? 'bg-background text-foreground font-semibold shadow-xs ring-1 ring-border/80'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span>Initial Cut ({initialCount})</span>
            </button>
          </div>
        ) : (
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border border-border/60 text-xs font-mono text-muted-foreground'>
            <span>Initial Selection · {initialCount} Frames</span>
          </div>
        )}
      </div>

      {/* Retrospective Reflection Note */}
      {hasRevisitedCut && activeCut === 'revisited' && revisitedNote && (
        <blockquote className='border-l-2 border-border/80 pl-3.5 py-0.5 text-xs sm:text-sm text-muted-foreground italic font-sans max-w-2xl'>
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
