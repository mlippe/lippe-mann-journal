'use client';

import { cn } from '@/lib/utils';

interface SessionCutSwitcherProps {
  activeCut: 'revisited' | 'initial';
  onCutChange: (cut: 'revisited' | 'initial') => void;
  hasRevisitedCut: boolean;
  initialCount: number;
  revisitedCount: number;
  className?: string;
}

export const SessionCutSwitcher = ({
  activeCut,
  onCutChange,
  hasRevisitedCut,
  initialCount,
  revisitedCount,
  className,
}: SessionCutSwitcherProps) => {
  if (!hasRevisitedCut) {
    return null;
  }

  return (
    <div
      role='tablist'
      aria-label='Session Auswahl'
      className={cn(
        'inline-flex items-center p-0.5 rounded-full bg-muted/60 border border-border/60 text-[10px] sm:text-[11px] font-mono shrink-0',
        className,
      )}
    >
      <button
        type='button'
        role='tab'
        aria-selected={activeCut === 'revisited'}
        onClick={() => onCutChange('revisited')}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-all duration-200 cursor-pointer',
          activeCut === 'revisited'
            ? 'bg-background text-foreground font-semibold shadow-xs ring-1 ring-border/80'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <span>Revisited ({revisitedCount})</span>
      </button>

      <button
        type='button'
        role='tab'
        aria-selected={activeCut === 'initial'}
        onClick={() => onCutChange('initial')}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-all duration-200 cursor-pointer',
          activeCut === 'initial'
            ? 'bg-background text-foreground font-semibold shadow-xs ring-1 ring-border/80'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <span>Initial ({initialCount})</span>
      </button>
    </div>
  );
};
