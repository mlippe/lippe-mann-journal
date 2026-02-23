'use client';

import { useRef, useCallback } from 'react';
import { type PostWithPhotos } from '@/db/schema';
import { useTRPC } from '@/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useInfiniteQuery } from '@tanstack/react-query';
import { type PostGetPublished } from '@/modules/posts/types';
import { type CollectionGetPostsInCollection } from '@/modules/collections/types';
import BlurImage from '@/components/blur-image';
import Link from 'next/link';

// A placeholder PostCard component to display different post types.
const PostCard = ({ post }: { post: PostWithPhotos }) => {
  if (post.type === 'ARTICLE') {
    console.log(post);
  }
  return (
    <div className='bg-background aspect-[0.8] '>
      {post.type === 'ARTICLE' &&
        post.coverImage &&
        post.coverImage?.length > 0 && (
          <div className='h-full p-3'>
            <Image
              src={post.coverImage}
              alt={post.title}
              width={750}
              height={750}
              className='object-contain w-full h-full'
            />
          </div>
        )}

      {post.type === 'ARTICLE' && post.title && !post.coverImage && (
        <div className='h-full p-3'>
          <div className='bg-muted h-full flex items-center justify-center p-8'>
            {post.title}
          </div>
        </div>
      )}

      {post.type === 'PHOTO' && post.postsToPhotos && post.postsToPhotos[0] && (
        <>
          <Link className='block h-full p-3' href={`/photo/${post.slug}`}>
            <BlurImage
              src={post.postsToPhotos[0].photo.url}
              alt={post.postsToPhotos[0].photo.title}
              width={post.postsToPhotos[0].photo.width / 4}
              height={post.postsToPhotos[0].photo.height / 4}
              blurhash={post.postsToPhotos[0].photo.blurData}
              className='object-contain w-full h-full'
            />
          </Link>
          <div className='p-3 md:hidden'>
            <span>{post.title}</span>
          </div>
        </>
      )}

      {post.type === 'ALBUM' &&
        post.postsToPhotos &&
        post.postsToPhotos.length > 0 && (
          <div className='h-full p-3 relative group'>
            <BlurImage
              src={post.postsToPhotos[0].photo.url}
              alt={post.postsToPhotos[0].photo.title}
              width={post.postsToPhotos[0].photo.width / 4}
              height={post.postsToPhotos[0].photo.height / 4}
              blurhash={post.postsToPhotos[0].photo.blurData}
              className='object-contain w-full h-full'
            />
            <Image
              src={post.postsToPhotos[1].photo.url}
              alt={post.postsToPhotos[1].photo.title}
              width={post.postsToPhotos[1].photo.width / 4}
              height={post.postsToPhotos[1].photo.height / 4}
              className='absolute z-1 object-contain w-full h-full top-0 left-0 p-3 hidden group-hover:block'
            />
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
    <div className='w-full space-y-8 py-8'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-muted gap-[0.06rem] border-y border-muted -mx-3 md:mx-0'>
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
