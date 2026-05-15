'use client';

import Link from 'next/link';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    <div className='w-full max-w-xl mx-auto -mt-3 md:mb-12'>
      <ScrollArea className='w-full whitespace-nowrap rounded-md'>
        <div className='flex w-max '>
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
                className='flex flex-col items-center gap-2 group hover:bg-muted-foreground/10 p-4 rounded-lg w-26 md:w-30'
              >
                <div className='p-0.5 rounded-full bg-linear-to-tr from-muted to-[#be3e62] transition-transform group-hover:scale-105 active:scale-95'>
                  <div className='p-0.5 rounded-full bg-background'>
                    <Avatar className='size-14 md:size-16'>
                      {imageUrl && (
                        <AvatarImage
                          src={imageUrl}
                          alt={collection.name}
                          className='object-cover'
                        />
                      )}
                      <AvatarFallback className='text-xs'>
                        {collection.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className='flex flex-col items-center'>
                  <span className='text-xs font-medium max-w-24 md:max-w-28 truncate'>
                    {collection.name}
                  </span>
                  <span className='text-[10px] text-muted-foreground'>
                    {collection.postCount} Einträge
                  </span>
                </div>
              </Link>
            );
          })}
          <Link
            href='/collections/'
            className='flex flex-col items-center gap-2 group hover:bg-muted-foreground/10 p-4 rounded-lg  w-26 md:w-30'
          >
            <div className='p-0.5 rounded-full bg-linear-to-tr from-muted to-foreground/15 transition-transform group-hover:scale-105 active:scale-95'>
              <div className='p-0.5 rounded-full bg-background'>
                <Avatar className='size-14 md:size-16 '>
                  <AvatarFallback className='text-foreground/60'>
                    <GalleryVerticalEnd />
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className='flex flex-col items-center'>
              <span className='text-xs font-medium max-w-27 truncate'>
                Alle Sammlungen
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
    <div className='w-full max-w-xl mx-auto  pb-3.5 pt-1   md:pb-16.5 overflow-hidden'>
      <div className='flex w-max space-x-10 md:space-x-12 md:px-6 px-5'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className='flex flex-col items-center gap-2.5 md:gap-2 animate-pulse'
          >
            <Skeleton className='md:size-18 size-16 rounded-full ' />
            <Skeleton className='h-3 w-12 ' />
            <Skeleton className='h-2 w-8 ' />
          </div>
        ))}
      </div>
    </div>
  );
};
