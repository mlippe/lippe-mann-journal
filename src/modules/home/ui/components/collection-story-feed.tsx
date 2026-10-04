'use client';

import Link from 'next/link';
import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { ArrowRight, GalleryVerticalEnd, Rss } from 'lucide-react';
import BlurImage from '@/components/blur-image';

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
    <div className='w-full max-w-5xl lg:max-w-6xl mx-auto mb-4 sm:mb-5 px-1'>
      <div className='flex items-center sm:justify-center gap-2 overflow-x-auto hide-scrollbar sm:flex-wrap py-1 -my-1'>
        {/* RSS Feed Chip */}
        <Link
          href='/feed.xml'
          target='_blank'
          rel='alternate type="application/rss+xml"'
          className='group inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-border/40 hover:border-foreground/30 bg-muted/15 hover:bg-muted/35 transition-all duration-200 select-none shrink-0 cursor-pointer shadow-2xs'
        >
          {/* Micro Icon Container */}
          <div className='relative size-5 sm:size-5.5 rounded-full overflow-hidden bg-muted/40 shrink-0 ring-1 ring-border/30 flex items-center justify-center group-hover:bg-muted/60 transition-colors'>
            <Rss className='size-3 sm:size-3.5 text-muted-foreground group-hover:text-foreground transition-colors' />
          </div>

          {/* Title */}
          <span className='text-xs font-medium text-foreground/85 group-hover:text-foreground transition-colors whitespace-nowrap'>
            RSS
          </span>
        </Link>

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
              className='group inline-flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-border/40 hover:border-foreground/30 bg-muted/15 hover:bg-muted/35 transition-all duration-200 select-none shrink-0 cursor-pointer shadow-2xs'
            >
              {/* Micro Thumbnail */}
              <div className='relative size-5 sm:size-5.5 rounded-full overflow-hidden bg-muted/40 shrink-0 ring-1 ring-border/30'>
                {imageUrl ? (
                  <BlurImage
                    src={imageUrl}
                    alt={collection.name}
                    fill
                    sizes='28px'
                    quality={75}
                    className='object-cover grayscale contrast-[1.05] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center font-mono text-[9px] text-muted-foreground'>
                    {collection.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Title & Count */}
              <span className='text-xs font-medium text-foreground/85 group-hover:text-foreground transition-colors whitespace-nowrap'>
                {collection.name}
              </span>
              <span className='text-[10px] font-mono text-muted-foreground/60 group-hover:text-muted-foreground transition-colors'>
                {collection.postCount}
              </span>
            </Link>
          );
        })}

        {/* "Alle Sammlungen" Chip */}
        <Link
          href='/collections/'
          className='group inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-border/60 hover:border-foreground/40 bg-transparent hover:bg-muted/25 transition-all duration-200 text-xs font-mono text-muted-foreground hover:text-foreground select-none shrink-0'
        >
          <GalleryVerticalEnd className='size-3.5 transition-transform group-hover:scale-110' />
          <span>Katalog</span>
          <ArrowRight className='size-3 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all' />
        </Link>
      </div>
    </div>
  );
};

export const CollectionStorySkeleton = () => {
  return (
    <div className='w-full max-w-5xl lg:max-w-6xl mx-auto mb-4 sm:mb-5 px-1'>
      <div className='flex items-center sm:justify-center gap-2 overflow-x-auto hide-scrollbar sm:flex-wrap py-1'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className='inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-border/30 bg-muted/10 shrink-0 animate-pulse'
          >
            <Skeleton className='size-5 sm:size-5.5 rounded-full' />
            <Skeleton className='h-3 w-14 rounded-full' />
            <Skeleton className='h-2.5 w-4 rounded-full' />
          </div>
        ))}
      </div>
    </div>
  );
};
