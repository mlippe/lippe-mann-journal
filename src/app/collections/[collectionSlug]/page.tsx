import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { ErrorBoundary } from 'react-error-boundary';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { type CollectionGetPostsInCollection } from '@/modules/collections/types';
import Footer from '@/components/footer';
import {
  InfiniteFeedView,
  InfiniteFeedViewLoadingStatus,
} from '@/modules/home/ui/views/infinite-feed-view';
import Image from 'next/image';
import { getOptimizedImageUrl } from '@/lib/images';

export const generateMetadata = async ({
  params,
}: {
  params: { collectionSlug: string };
}) => {
  const queryClient = getQueryClient();
  const collection = await queryClient.fetchQuery(
    trpc.collections.getCollectionBySlug.queryOptions({
      slug: params.collectionSlug,
    }),
  );

  const imageUrl = collection?.coverImageUrl
    ? getOptimizedImageUrl(collection.coverImageUrl)
    : undefined;

  const description = collection?.description || 'Collection details and posts.';

  return {
    title: collection?.name || 'Collection',
    description,
    openGraph: {
      title: collection?.name || 'Collection',
      description,
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: collection?.name || 'Collection',
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
};

const SingleCollectionView = ({
  params,
}: {
  params: { collectionSlug: string };
}) => {
  const { collectionSlug } = params;

  return (
    <div className='flex flex-col min-h-screen w-full'>
      {/* Collection Header */}
      <Suspense fallback={<div className='w-full h-[50vh] bg-muted animate-pulse' />}>
        <CollectionHeaderSuspense collectionSlug={collectionSlug} />
      </Suspense>

      {/* Posts in Collection (Infinite Feed) */}
      <div className='w-full max-w-3xl mx-auto space-y-8 py-8 px-4'>
        <Suspense fallback={<InfiniteFeedViewLoadingStatus />}>
          <ErrorBoundary fallback={<p>Error loading posts.</p>}>
            <InfiniteFeedSuspense collectionSlug={collectionSlug} />
          </ErrorBoundary>
        </Suspense>
      </div>
      <Footer />
    </div>
  );
};

async function CollectionHeaderSuspense({ collectionSlug }: { collectionSlug: string }) {
  const queryClient = getQueryClient();
  const collection = await queryClient.fetchQuery(
    trpc.collections.getCollectionBySlug.queryOptions({ slug: collectionSlug }),
  );

  if (!collection) {
    return <div className='text-center py-10'>Collection not found.</div>;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='relative w-full h-[50vh] flex items-end p-8 text-white'>
        {collection.coverImageUrl && (
          <Image
            src={collection.coverImageUrl}
            alt={collection.name}
            fill
            className='object-cover -z-10'
            priority
          />
        )}
        <div className='absolute inset-0 bg-black/50 -z-10' />
        <div>
          <h1 className='text-5xl font-bold'>{collection.name}</h1>
          {collection.description && (
            <p className='text-xl mt-2'>{collection.description}</p>
          )}
        </div>
      </div>
    </HydrationBoundary>
  );
}

async function InfiniteFeedSuspense({ collectionSlug }: { collectionSlug: string }) {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery({
    ...trpc.collections.getPostsInCollection.infiniteQueryOptions({
      collectionSlug,
      limit: 5,
    }),
    getNextPageParam: (lastPage: CollectionGetPostsInCollection) =>
      lastPage.nextCursor,
    initialPageParam: 1,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InfiniteFeedView collectionSlug={collectionSlug} />
    </HydrationBoundary>
  );
}

export default SingleCollectionView;
