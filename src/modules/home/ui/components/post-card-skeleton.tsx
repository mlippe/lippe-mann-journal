import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PostCardSkeletonProps {
  className?: string;
}

export const PostCardSkeleton = ({ className }: PostCardSkeletonProps) => {
  const shimmerClass =
    'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-linear-to-r before:from-transparent before:via-foreground/10 before:to-transparent bg-muted/80 animate-none';

  return (
    <div
      className={cn(
        'bg-background lg:aspect-[0.8] flex flex-col group/card w-full',
        className,
      )}
    >
      {/* Mobile Header Skeleton - Matches md:hidden */}
      <div className='p-3 pt-6 md:hidden flex gap-2 items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Skeleton className={cn('size-9 rounded-full', shimmerClass)} />
          <Skeleton className={cn('h-4 w-16', shimmerClass)} />
        </div>
        <Skeleton className={cn('h-3 w-20', shimmerClass)} />
      </div>

      {/* Media Skeleton - The main aspect ratio box with shimmer */}
      <div className='relative aspect-[0.8] p-3'>
        <Skeleton className={cn('w-full h-full rounded-none', shimmerClass)} />
      </div>

      {/* Mobile Footer Skeleton - Matches md:hidden */}
      <div className='p-3 pt-5 pb-6 md:hidden flex gap-2 flex-col w-full'>
        <div className='flex items-center justify-between gap-4'>
          <Skeleton className={cn('h-5 w-3/4', shimmerClass)} />
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-1'>
              <Skeleton className={cn('size-5 rounded-full', shimmerClass)} />
              <Skeleton className={cn('h-3 w-4', shimmerClass)} />
            </div>
            <div className='flex items-center gap-1'>
              <Skeleton className={cn('size-5 rounded-full', shimmerClass)} />
              <Skeleton className={cn('h-3 w-4', shimmerClass)} />
            </div>
          </div>
        </div>
        <Skeleton className={cn('h-3 w-24', shimmerClass)} />
      </div>
    </div>
  );
};
