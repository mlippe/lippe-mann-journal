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
    <div className='grid grid-cols-1 gap-4 @xl/main:grid-cols-3'>
      {cardData.map((card) => (
        <Card key={card.title} className='@container/card'>
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
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
    <div className='grid grid-cols-1 gap-4 @xl/main:grid-cols-3'>
      {[1, 2, 3].map((i) => (
        <Card key={i} className='@container/card'>
          <CardHeader>
            <CardDescription>
              <Skeleton className='h-4 w-20' />
            </CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
              <Skeleton className='h-8 w-16 mt-2' />
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};
