import { Skeleton } from '@/components/ui/skeleton';

export const EditorialStorySkeleton = () => {
  return (
    <article className='w-full max-w-6xl mx-auto py-6 md:py-12 animate-pulse space-y-10'>
      {/* Header Skeleton */}
      <div className='mt-10 md:mt-0 space-y-4 mb-8 border-b border-border/40 pb-6'>
        <div className='hidden md:flex items-center justify-between'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-24' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-3 w-28' />
          <Skeleton className='h-3 w-16' />
        </div>
        <Skeleton className='h-10 md:h-14 w-3/4 max-w-xl' />
      </div>

      {/* Hero Bleed Skeleton */}
      <div className='w-full aspect-[3/2] bg-muted/40 rounded-xs overflow-hidden relative border border-border/40'>
        <Skeleton className='w-full h-full' />
      </div>

      {/* Field Note Skeleton */}
      <div className='max-w-2xl mx-auto space-y-3 pt-6 border-l-2 border-border/50 pl-6'>
        <Skeleton className='h-5 w-full' />
        <Skeleton className='h-5 w-4/5' />
        <Skeleton className='h-5 w-2/3' />
      </div>

      {/* Diptych Skeleton */}
      <div className='flex flex-col md:flex-row gap-4 md:gap-8 max-w-6xl mx-auto pt-8'>
        <div className='flex-1 aspect-[4/5] bg-muted/40 rounded-xs border border-border/40'>
          <Skeleton className='w-full h-full' />
        </div>
        <div className='flex-1 aspect-[4/5] bg-muted/40 rounded-xs border border-border/40'>
          <Skeleton className='w-full h-full' />
        </div>
      </div>
    </article>
  );
};
