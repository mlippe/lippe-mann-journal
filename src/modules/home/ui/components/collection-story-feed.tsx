'use client';

import Link from 'next/link';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';

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
    <div className='w-full max-w-3xl mx-auto py-6'>
      <ScrollArea className='w-full whitespace-nowrap rounded-md'>
        <div className='flex w-max space-x-4 px-4  py-2'>
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
                className='flex flex-col items-center gap-2 group'
              >
                <div className='p-0.5 rounded-full bg-linear-to-tr from-muted to-[#be3e62] transition-transform group-hover:scale-105 active:scale-95'>
                  <div className='p-0.5 rounded-full bg-background'>
                    <Avatar className='size-16 '>
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
                  <span className='text-xs font-medium max-w-32 truncate'>
                    {collection.name}
                  </span>
                  <span className='text-[10px] text-muted-foreground'>
                    {collection.postCount} Einträge
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
    </div>
  );
};

export const CollectionStorySkeleton = () => {
  return (
    <div className='w-full py-6'>
      <div className='flex w-max space-x-4 px-4'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='flex flex-col items-center gap-2'>
            <Skeleton className='size-18 rounded-full' />
            <Skeleton className='h-3 w-12' />
            <Skeleton className='h-2 w-8' />
          </div>
        ))}
      </div>
    </div>
  );
};
