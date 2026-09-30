'use client';

import Link from 'next/link';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { GalleryVerticalEnd } from 'lucide-react';

export const CollectionStoryFeed = () => {
  const trpc = useTRPC();
  const { data: collections, isLoading } = useQuery(
    trpc.collections.getFeaturedCollections.queryOptions({ limit: 10 }),
  );

  if (isLoading) {
    return <CollectionStorySkeleton />;
  }

  if (!collections || collections.length === 0) {
    return null;
  }

  return (
    <div className='w-full max-w-2xl mx-auto mb-6 md:mb-12'>
      <ScrollArea className='w-full whitespace-nowrap rounded-lg'>
        <div className='flex w-max gap-3 sm:gap-4 px-1 py-2'>
          {collections.map((collection) => {
            const imageUrl = collection.coverImageUrl
              ? keyToUrl(collection.coverImageUrl)
              : collection.latestPostImage
                ? keyToUrl(collection.latestPostImage)
                : null;

            return (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className='flex flex-col items-center gap-2 group w-20 sm:w-24 select-none'
              >
                {/* Rectangular 3:4 Monochrome Print Card */}
                <div className='relative w-20 sm:w-24 aspect-[3/4] rounded-sm overflow-hidden bg-muted/40 border border-border/50 group-hover:border-foreground/50 transition-colors shadow-2xs'>
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={collection.name}
                      className='w-full h-full object-cover grayscale contrast-[1.05] group-hover:grayscale-0 group-hover:scale-105 transition-[filter,transform] duration-500'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center font-mono text-xs text-muted-foreground'>
                      {collection.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className='flex flex-col items-center w-full text-center'>
                  <span className='text-[11px] sm:text-xs font-medium max-w-full truncate text-foreground group-hover:text-foreground transition-colors'>
                    {collection.name}
                  </span>
                  <span className='text-[10px] font-mono text-muted-foreground'>
                    {collection.postCount} {collection.postCount === 1 ? 'Eintrag' : 'Einträge'}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* "Alle Sammlungen" Card */}
          <Link
            href='/collections/'
            className='flex flex-col items-center gap-2 group w-20 sm:w-24 select-none'
          >
            <div className='relative w-20 sm:w-24 aspect-[3/4] rounded-sm overflow-hidden bg-muted/20 border border-dashed border-border/60 group-hover:border-foreground/50 group-hover:bg-muted/40 transition-all flex flex-col items-center justify-center gap-1.5 text-muted-foreground group-hover:text-foreground'>
              <GalleryVerticalEnd className='size-5 transition-transform group-hover:scale-110' />
              <span className='text-[9px] font-mono uppercase tracking-wider'>Alle</span>
            </div>
            <div className='flex flex-col items-center w-full text-center'>
              <span className='text-[11px] sm:text-xs font-medium max-w-full truncate text-foreground'>
                Übersicht
              </span>
              <span className='text-[10px] font-mono text-muted-foreground'>
                Katalog
              </span>
            </div>
          </Link>
        </div>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
    </div>
  );
};

export const CollectionStorySkeleton = () => {
  return (
    <div className='w-full max-w-2xl mx-auto pb-4 pt-1 md:pb-12 overflow-hidden'>
      <div className='flex w-max gap-3 sm:gap-4 px-1 py-2'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className='flex flex-col items-center gap-2 w-20 sm:w-24 animate-pulse'
          >
            <Skeleton className='w-20 sm:w-24 aspect-[3/4] rounded-sm' />
            <Skeleton className='h-3 w-16' />
            <Skeleton className='h-2 w-10' />
          </div>
        ))}
      </div>
    </div>
  );
};
