import { cn } from '@/lib/utils';

interface TimelineDividerProps {
  label: string;
  month?: string;
  year?: string;
  count: number;
  className?: string;
}

export const TimelineDivider = ({
  label,
  month,
  year,
  count,
  className,
}: TimelineDividerProps) => {
  const parts = label.trim().split(/\s+/);
  const rawMonth = month || parts[0] || label;
  const displayYear =
    year || (parts.length > 1 ? parts.slice(1).join(' ') : '');
  const formattedMonth =
    rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1).toLowerCase();

  return (
    <div
      className={cn(
        'col-span-full bg-background select-none transition-colors',
        'py-7 px-4 sm:px-0 sm:py-9 md:py-10',
        className,
      )}
    >
      <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
        {/* Left: Editorial Chapter Title */}
        <div className='space-y-1.5'>
          <div className='flex items-baseline gap-2 sm:gap-3'>
            <h3 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight md:tracking-[-0.03em] text-foreground leading-none'>
              {formattedMonth}
            </h3>
            {displayYear && (
              <span className='text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light tracking-tight text-muted-foreground/70 tabular-nums'>
                {displayYear}
              </span>
            )}
          </div>
        </div>

        {/* Right: Tactile Editorial Badge */}
        <div className='flex items-center gap-2 self-start sm:self-end'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/50 bg-muted/20 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-muted-foreground tabular-nums'>
            <span className='size-1 rounded-full bg-foreground/40' />
            <span>
              {String(count).padStart(2, '0')}{' '}
              {count === 1 ? 'Eintrag' : 'Einträge'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
