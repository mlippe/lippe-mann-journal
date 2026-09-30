'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTRPC } from '@/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';

export function SectionCardsView() {
  const trpc = useTRPC();
  const { data: stats } = useSuspenseQuery(
    trpc.dashboard.getDashboardStats.queryOptions(),
  );
  
  const cardData = [
    { title: 'Total Photos', value: stats.totalPhotos },
    { title: 'Total Posts', value: stats.totalPosts },
    { title: 'Total Collections', value: stats.totalCollections },
  ];

  return (
    <div className='grid grid-cols-3 gap-2 sm:gap-4'>
      {cardData.map((card) => (
        <Card key={card.title} className='p-3 sm:p-5 border-border/70'>
          <CardHeader className='p-0 space-y-1'>
            <CardDescription className='text-[11px] sm:text-xs text-muted-foreground truncate'>
              {card.title}
            </CardDescription>
            <CardTitle className='text-lg sm:text-2xl md:text-3xl font-semibold tabular-nums leading-none sm:leading-normal'>
              {card.value.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export const SectionCardsLoading = () => {
  return (
    <div className='grid grid-cols-3 gap-2 sm:gap-4'>
      {[1, 2, 3].map((i) => (
        <Card key={i} className='p-3 sm:p-5 border-border/70'>
          <CardHeader className='p-0 space-y-1.5'>
            <CardDescription>
              <Skeleton className='h-3 w-16' />
            </CardDescription>
            <CardTitle>
              <Skeleton className='h-6 sm:h-8 w-12 sm:w-16 mt-1' />
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};
