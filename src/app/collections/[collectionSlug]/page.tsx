import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { ErrorBoundary } from 'react-error-boundary';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
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

const SingleCollectionView = async ({
  params,
}: {
  params: { collectionSlug: string };
}) => {
  const { collectionSlug } = params;
  const queryClient = getQueryClient();

  // Prefetch collection details
  const collection = await queryClient.fetchQuery(
    trpc.collections.getCollectionBySlug.queryOptions({ slug: collectionSlug }),
  );

  // Prefetch first page of posts in collection
  await queryClient.prefetchInfiniteQuery(
    trpc.collections.getPostsInCollection.infiniteQueryOptions(
      { collectionSlug, limit: 5 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  );

  if (!collection) {
    return <div className='text-center py-10'>Collection not found.</div>;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='flex flex-col min-h-screen w-full'>
        {/* Collection Header */}
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

        {/* Posts in Collection (Infinite Feed) */}
        <div className='w-full max-w-3xl mx-auto space-y-8 py-8 px-4'>
          <Suspense fallback={<InfiniteFeedViewLoadingStatus />}>
            <ErrorBoundary fallback={<p>Error loading posts.</p>}>
              {/* Pass collectionSlug to InfiniteFeedView to filter posts */}
              <InfiniteFeedView collectionSlug={collection.slug} />
            </ErrorBoundary>
          </Suspense>
        </div>
        <Footer />
      </div>
    </HydrationBoundary>
  );
};

export default SingleCollectionView;
