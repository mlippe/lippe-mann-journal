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
import Link from 'next/link';
import {
  IconArrowUpRight,
  IconFiles,
  IconFolder,
  IconPhoto,
} from '@tabler/icons-react';

export function SectionCardsView() {
  const trpc = useTRPC();
  const { data: stats } = useSuspenseQuery(
    trpc.dashboard.getDashboardStats.queryOptions(),
  );

  const cardData = [
    {
      title: 'Posts',
      value: stats.totalPosts,
      href: '/dashboard/posts',
      icon: IconFiles,
      caption: 'Beiträge',
    },
    {
      title: 'Collections',
      value: stats.totalCollections,
      href: '/dashboard/collections',
      icon: IconFolder,
      caption: 'Sammlungen',
    },
    {
      title: 'Fotos',
      value: stats.totalPhotos,
      href: '/dashboard/photos',
      icon: IconPhoto,
      caption: 'Aufnahmen',
    },
  ];

  return (
    <div className='grid grid-cols-3 gap-2 sm:gap-4'>
      {cardData.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className='group block active:scale-[0.98] transition-all'
        >
          <Card className='h-full p-3 sm:p-4 border-border/70 hover:border-primary/50 hover:bg-accent/40 transition-all cursor-pointer shadow-2xs'>
            <CardHeader className='p-0 space-y-1.5'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1 sm:gap-1.5 text-muted-foreground group-hover:text-primary transition-colors min-w-0'>
                  <card.icon className='size-3.5 sm:size-4 shrink-0' />
                  <CardDescription className='text-xs sm:text-sm font-semibold text-foreground truncate'>
                    {card.title}
                  </CardDescription>
                </div>
                <IconArrowUpRight className='size-3 sm:size-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0' />
              </div>

              <CardTitle className='text-lg sm:text-2xl md:text-3xl font-bold tabular-nums leading-none sm:leading-normal'>
                {card.value.toLocaleString()}
              </CardTitle>

              <p className='text-[10px] sm:text-xs text-muted-foreground font-medium flex items-center gap-0.5'>
                <span>Öffnen</span>
                <span className='group-hover:translate-x-0.5 transition-transform'>
                  →
                </span>
              </p>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export const SectionCardsLoading = () => {
  return (
    <div className='grid grid-cols-3 gap-2 sm:gap-4'>
      {[1, 2, 3].map((i) => (
        <Card key={i} className='p-3 sm:p-4 border-border/70'>
          <CardHeader className='p-0 space-y-2'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-3 w-14 sm:w-20' />
              <Skeleton className='size-3 rounded-xs' />
            </div>
            <Skeleton className='h-6 sm:h-8 w-10 sm:w-16 mt-1' />
            <Skeleton className='h-2.5 w-10' />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};
