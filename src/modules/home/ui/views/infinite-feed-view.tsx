'use client';

import { useRef, useCallback } from 'react';
import Footer from '@/components/footer';
import type { Post, Photo } from '@/db/schema';
import { useTRPC } from '@/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

// A placeholder PostCard component to display different post types.
const PostCard = ({
  post,
}: {
  post: Post & { postsToPhotos: { photo: Photo }[] };
}) => {
  return (
    <div className='p-4 border rounded-lg shadow-sm bg-card'>
      <h2 className='text-xl font-bold mb-2'>{post.title}</h2>
      {/* {post.description && (
        <p className='text-muted-foreground mb-4'>{post.description}</p>
      )} */}

      {post.type === 'ARTICLE' && post.content && (
        <div className='prose prose-sm dark:prose-invert max-h-24 overflow-hidden'>
          {post.content}
        </div>
      )}

      {post.type === 'PHOTO' && post.postsToPhotos[0] && (
        <div className='rounded-md overflow-hidden'>
          <Image
            src={post.postsToPhotos[0].photo.url}
            alt={post.postsToPhotos[0].photo.title}
            width={post.postsToPhotos[0].photo.width}
            height={post.postsToPhotos[0].photo.height}
            className='w-full h-auto'
          />
        </div>
      )}

      {post.type === 'ALBUM' && post.postsToPhotos.length > 0 && (
        <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
          {post.postsToPhotos.map(({ photo }) => (
            <div
              key={photo.id}
              className='rounded-md overflow-hidden aspect-square'
            >
              <Image
                src={photo.url}
                alt={photo.title}
                width={photo.width}
                height={photo.height}
                className='w-full h-full object-cover'
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface InfiniteFeedViewProps {
  collectionSlug?: string;
}

export const InfiniteFeedView = ({ collectionSlug }: InfiniteFeedViewProps) => {
  const trpc = useTRPC();

  // Using the trpc hooks directly to avoid queryOptions union issues
  const feedQuery = trpc.posts.getPublished.useInfiniteQuery(
    { limit: 5 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: 1,
      enabled: !collectionSlug,
    },
  );

  const collectionQuery =
    trpc.collections.getPostsInCollection.useInfiniteQuery(
      { collectionSlug: collectionSlug || '', limit: 5 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: 1,
        enabled: !!collectionSlug,
      },
    );

  const activeQuery = collectionSlug ? collectionQuery : feedQuery;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = activeQuery;

  const observer = useRef<IntersectionObserver>(null);
  const lastPostRef = useCallback(
    (node: HTMLDivElement) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage],
  );

  const posts = data?.pages.flatMap((page) => page.items) || [];

  return (
    <div className='w-full max-w-3xl mx-auto space-y-8 py-8'>
      <div className='space-y-8'>
        {posts.map((post, i) => (
          <div key={post.id} ref={i === posts.length - 1 ? lastPostRef : null}>
            <PostCard
              post={post as Post & { postsToPhotos: { photo: Photo }[] }}
            />
          </div>
        ))}
      </div>
      {isFetchingNextPage && (
        <div className='space-y-8'>
          <Skeleton className='w-full h-64 rounded-lg' />
          <Skeleton className='w-full h-64 rounded-lg' />
        </div>
      )}
      {!hasNextPage && posts.length > 0 && !isFetchingNextPage && <Footer />}
    </div>
  );
};

export const InfiniteFeedViewLoadingStatus = () => {
  return (
    <div className='w-full max-w-3xl mx-auto space-y-8 py-8 px-4'>
      <div className='space-y-8'>
        <Skeleton className='w-full h-64 rounded-lg' />
        <Skeleton className='w-full h-64 rounded-lg' />
        <Skeleton className='w-full h-64 rounded-lg' />
      </div>
    </div>
  );
};
