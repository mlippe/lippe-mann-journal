import { cn } from '@/lib/utils';

interface TimelineDividerProps {
  label: string;
  count: number;
  className?: string;
}

export const TimelineDivider = ({
  label,
  count,
  className,
}: TimelineDividerProps) => {
  return (
    <div
      className={cn(
        'col-span-full pt-10 pb-4 first:pt-2 flex items-center gap-4 select-none',
        className,
      )}
    >
      <div className='flex items-baseline gap-2'>
        <span className='text-xs uppercase tracking-widest font-mono text-foreground font-semibold'>
          {label}
        </span>
        <span className='text-[10px] uppercase font-mono text-muted-foreground'>
          ({count} {count === 1 ? 'Eintrag' : 'Einträge'})
        </span>
      </div>
      <div className='h-px flex-1 bg-border/60' />
    </div>
  );
};
