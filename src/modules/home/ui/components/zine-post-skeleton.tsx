import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const ZinePostSkeleton = () => {
  const shimmerClass =
    'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-linear-to-r before:from-transparent before:via-foreground/10 before:to-transparent bg-muted/80 animate-none';

  return (
    <article className='w-full py-10 md:py-16 border-b border-border/40 last:border-b-0 space-y-4'>
      {/* Header Skeleton */}
      <div className='space-y-3 max-w-2xl'>
        <div className='flex items-center gap-2'>
          <Skeleton className={cn('h-3 w-20', shimmerClass)} />
          <Skeleton className={cn('h-3 w-28', shimmerClass)} />
        </div>
        <Skeleton className={cn('h-9 md:h-11 w-4/5', shimmerClass)} />
        <Skeleton className={cn('h-4 w-full pt-1', shimmerClass)} />
        <Skeleton className={cn('h-4 w-2/3', shimmerClass)} />
      </div>

      {/* Main Photographic Frame Skeleton */}
      <div className='w-full aspect-[3/2] max-h-[75vh]'>
        <Skeleton className={cn('w-full h-full rounded-none', shimmerClass)} />
      </div>

      {/* Footer Skeleton */}
      <div className='pt-4 flex items-center justify-between border-t border-border/30'>
        <div className='flex items-center gap-3'>
          <Skeleton className={cn('size-5 rounded-full', shimmerClass)} />
          <Skeleton className={cn('h-3.5 w-6', shimmerClass)} />
          <Skeleton className={cn('size-5 rounded-full', shimmerClass)} />
          <Skeleton className={cn('h-3.5 w-6', shimmerClass)} />
        </div>
        <Skeleton className={cn('h-3 w-28', shimmerClass)} />
      </div>
    </article>
  );
};
