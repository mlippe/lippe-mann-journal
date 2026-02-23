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
    return data?.pages
      .flatMap((page) => (page.items as PostWithPhotos[]) || [])
      .filter((post) => post.visibility === 'public') || [];
  }, [data?.pages]);

  return (
    <div className='w-full space-y-8 py-8'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-muted gap-[0.06rem] border-y border-muted -mx-3 md:mx-0'>
        {posts.map((post, i) => (
          <div 
            key={post.id} 
            ref={i === posts.length - 1 ? lastElementRef : null}
          >
            <PostCard post={post} />
          </div>
        ))}
      </div>
      
      {isFetchingNextPage && <LoadingSkeletons count={2} />}
    </div>
  );
};

const LoadingSkeletons = ({ count = 3 }: { count?: number }) => (
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className='w-full aspect-[0.8] rounded-none' />
    ))}
  </div>
);

export const InfiniteFeedViewLoadingStatus = () => {
  return (
    <div className='w-full py-8'>
      <LoadingSkeletons count={3} />
    </div>
  );
};
