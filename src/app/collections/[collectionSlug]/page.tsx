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
import { getOptimizedImageUrl } from '@/lib/images';

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ collectionSlug: string }>;
}) => {
  try {
    const { collectionSlug } = await params;
    const queryClient = getQueryClient();
    const collection = await queryClient.fetchQuery(
      trpc.collections.getCollectionBySlug.queryOptions({
        slug: collectionSlug,
      }),
    );

    const imageUrl = collection?.coverImageUrl
      ? getOptimizedImageUrl(collection.coverImageUrl)
      : undefined;

    const description =
      collection?.description || 'Collection details and posts.';

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
  } catch (error) {
    return {
      title: 'Sammlung',
    };
  }
};

const SingleCollectionView = async ({
  params,
}: {
  params: Promise<{ collectionSlug: string }>;
}) => {
  const { collectionSlug } = await params;

  return (
    <div className='flex flex-col w-full'>
      <div className='w-full lg:mt-16 mt-10 pb-3'>
        {/* Collection Header */}
        <Suspense
          fallback={
            <div className='px-4 py-7 w-full  flex flex-col gap-5 justify-cente items-center'>
              <div className='animate-pulse bg-foreground/10 w-full  max-w-36 rounded-xl h-5' />

              <div className='animate-pulse bg-foreground/10 w-full max-w-56 rounded-xl h-3' />
            </div>
          }
        >
          <CollectionHeaderSuspense collectionSlug={collectionSlug} />
        </Suspense>

        {/* Posts in Collection (Infinite Feed) */}
        <div className='w-full'>
          <Suspense fallback={<InfiniteFeedViewLoadingStatus />}>
            <ErrorBoundary
              fallback={
                <p className='text-center py-10'>
                  Something went wrong while showing the collection feed, please
                  try again.
                </p>
              }
            >
              <InfiniteFeedSuspense collectionSlug={collectionSlug} />
            </ErrorBoundary>
          </Suspense>
        </div>
        <Footer />
      </div>
    </div>
  );
};

async function CollectionHeaderSuspense({
  collectionSlug,
}: {
  collectionSlug: string;
}) {
  const queryClient = getQueryClient();
  const collection = await queryClient.fetchQuery(
    trpc.collections.getCollectionBySlug.queryOptions({ slug: collectionSlug }),
  );

  if (!collection) {
    return <div className='text-center py-10'>Collection not found.</div>;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='flex justify-center -mx-3'>
        <div className='flex flex-col items-center gap-4 p-4 md:p-6 font-light relative max-w-3xl w-full'>
          {/* NAME & DESCRIPTION */}
          <div className='flex flex-col items-center text-center'>
            <h1 className='text-xl font-medium'>{collection.name}</h1>
            {collection.description && (
              <p className='mt-2 text-center text-foreground text-sm  md:text-base max-w-xl'>
                {collection.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </HydrationBoundary>
  );
}

async function InfiniteFeedSuspense({
  collectionSlug,
}: {
  collectionSlug: string;
}) {
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
