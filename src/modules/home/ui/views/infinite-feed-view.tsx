'use client';

import { useMemo } from 'react';
import { type PostWithPhotos } from '@/db/schema';
import { useTRPC } from '@/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useInfiniteQuery } from '@tanstack/react-query';
import { type PostGetPublished } from '@/modules/posts/types';
import { type CollectionGetPostsInCollection } from '@/modules/collections/types';
import { PostCard } from '../components/post-card';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { AspectRatio } from '@radix-ui/react-aspect-ratio';
import VectorTopLeftAnimation from '../components/vector-top-left-animation';

interface InfiniteFeedViewProps {
  collectionSlug?: string;
}

type FeedPage = PostGetPublished | CollectionGetPostsInCollection;

export const InfiniteFeedView = ({ collectionSlug }: InfiniteFeedViewProps) => {
  const trpc = useTRPC();

  const queryOptions = collectionSlug
    ? trpc.collections.getPostsInCollection.infiniteQueryOptions({
        collectionSlug,
        limit: 5,
      })
    : trpc.posts.getPublished.infiniteQueryOptions({
        limit: 5,
      });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      ...queryOptions,
      getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor,
      initialPageParam: 1,
    });

  const { lastElementRef } = useIntersectionObserver({
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  });

  const posts = useMemo(() => {
    return (
      data?.pages
        .flatMap((page) => (page.items as PostWithPhotos[]) || [])
        .filter((post) => post.visibility === 'public') || []
    );
  }, [data?.pages]);

  return (
    <div className='w-full space-y-8 py-8 max-w-420 mx-auto'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-muted gap-3 md:gap-[0.06rem]  border-muted  border-y-12 md:border-y -mx-3 md:mx-0'>
        {posts.map((post, i) => (
          <div
            key={post.id}
            ref={i === posts.length - 1 ? lastElementRef : null}
          >
            <PostCard post={post} index={i} />
          </div>
        ))}
      </div>

      {isFetchingNextPage && <InfiniteFeedViewLoadingStatus />}
    </div>
  );
};

export const InfiniteFeedViewLoadingStatus = () => {
  return (
    <div className='mt-3 w-full grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3'>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className='w-full relative group cursor-pointer'>
          <AspectRatio
            ratio={0.75 / 1}
            className='overflow-hidden rounded-lg relative'
          >
            <Skeleton className='w-full h-full' />
          </AspectRatio>

          <div className='absolute top-0 left-0 z-20'>
            <VectorTopLeftAnimation title='Loading...' />
          </div>
        </div>
      ))}
    </div>
  );
};
