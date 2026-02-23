'use client';

import { useRef, useCallback } from 'react';
import Footer from '@/components/footer';
import { type PostWithPhotos } from '@/db/schema';
import { useTRPC } from '@/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useInfiniteQuery } from '@tanstack/react-query';
import { type PostGetPublished } from '@/modules/posts/types';
import { type CollectionGetPostsInCollection } from '@/modules/collections/types';

// A placeholder PostCard component to display different post types.
const PostCard = ({ post }: { post: PostWithPhotos }) => {
  return (
    <div className='p-4 border rounded-lg shadow-sm bg-card'>
      <h2 className='text-xl font-bold mb-2'>{post.title}</h2>

      {post.type === 'ARTICLE' && post.content && (
        <div className='prose prose-sm dark:prose-invert max-h-24 overflow-hidden'>
          {post.content}
        </div>
      )}

      {post.type === 'PHOTO' && post.postsToPhotos && post.postsToPhotos[0] && (
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

      {post.type === 'ALBUM' &&
        post.postsToPhotos &&
        post.postsToPhotos.length > 0 && (
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

  // Move pagination parameters from infiniteQueryOptions (which in this tRPC version might not expect them)
  // to the useInfiniteQuery hook directly to resolve the TS error and ensure consistent behavior.
  const feedQueryOptions = trpc.posts.getPublished.infiniteQueryOptions({
    limit: 5,
  });
  const collectionQueryOptions =
    trpc.collections.getPostsInCollection.infiniteQueryOptions({
      collectionSlug: collectionSlug || '',
      limit: 5,
    });

  // Use the correctly inferred type for the output of both procedures
  type FeedPage = PostGetPublished | CollectionGetPostsInCollection;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      ...(collectionSlug ? collectionQueryOptions : feedQueryOptions),
      getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor,
      initialPageParam: 1,
    });

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

  const posts =
    data?.pages
      .flatMap((page: FeedPage) => (page.items as PostWithPhotos[]) || [])
      .filter((post) => post.visibility === 'public') || [];

  return (
    <div className='w-full max-w-3xl mx-auto space-y-8 py-8'>
      <div className='space-y-8'>
        {posts.map((post, i: number) => (
          <div key={post.id} ref={i === posts.length - 1 ? lastPostRef : null}>
            <PostCard post={post} />
          </div>
        ))}
      </div>
      {isFetchingNextPage && (
        <div className='space-y-8'>
          <Skeleton className='w-full h-64 rounded-lg' />
          <Skeleton className='w-full h-64 rounded-lg' />
        </div>
      )}
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
