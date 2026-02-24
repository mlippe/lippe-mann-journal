'use client';

import { type PostWithPhotos } from '@/db/schema';
import { useTRPC } from '@/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { PostCard } from './post-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FeedPreviewProps {
  excludeSlug?: string;
  limit?: number;
}

export const FeedPreview = ({ excludeSlug, limit = 3 }: FeedPreviewProps) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.posts.getPublished.queryOptions({
      limit: limit + 1, // Fetch one extra in case the current one is included
    }),
  );

  const posts = (data?.items as PostWithPhotos[]) || [];
  const filteredPosts = posts
    .filter((post) => post.slug !== excludeSlug)
    .slice(0, limit);

  if (isLoading) {
    return (
      <div className='w-full py-8 space-y-8 max-w-420 mx-auto'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-muted gap-[0.06rem] border-y border-muted -mx-3 md:mx-0'>
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className='w-full aspect-[0.8] rounded-none' />
          ))}
        </div>
      </div>
    );
  }

  if (filteredPosts.length === 0) {
    return null;
  }

  return (
    <div className='w-full pt-8 space-y-12 max-w-420 mx-auto relative'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-muted gap-[0.06rem] border-y border-muted -mx-3 md:mx-0'>
        {filteredPosts.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}
      </div>
      <div className='absolute bottom-0 -left-3 w-[calc(100%+1.5rem)] h-[75vh] md:h-1/2  z-50 flex flex-col gap-4 justify-center items-center pb-10 bg-linear-to-b from-background/0 via-background/90 to-background via-40% to-80%  '>
        <p className='text-foreground font-medium text-xl'>Du willst mehr?</p>
        <Button asChild className='rounded-full px-8'>
          <Link href='/'>Alle Einträge ansehen</Link>
        </Button>
      </div>
    </div>
  );
};
