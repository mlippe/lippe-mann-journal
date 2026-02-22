import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { ErrorBoundary } from 'react-error-boundary';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import ProfileCard from '@/modules/home/ui/components/profile-card';

import Footer from '@/components/footer';
import {
  FeaturedCollectionsView,
  FeaturedCollectionsViewLoadingStatus,
} from '@/modules/home/ui/views/featured-collections-view';
import {
  InfiniteFeedView,
  InfiniteFeedViewLoadingStatus,
} from '@/modules/home/ui/views/infinite-feed-view';

const page = async () => {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.collections.getFeaturedCollections.queryOptions({ limit: 12 }),
  );
  void queryClient.prefetchInfiniteQuery(
    trpc.posts.getPublished.infiniteQueryOptions({ limit: 5 }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='flex flex-col w-full'>
        <div className='w-full mt-10  space-y-3 pb-3'>
          {/* PROFILE CARD  */}
          <ProfileCard />

          {/* FEATURED COLLECTIONS  */}
          <Suspense fallback={<FeaturedCollectionsViewLoadingStatus />}>
            <ErrorBoundary fallback={<p>Something went wrong Collections</p>}>
              <FeaturedCollectionsView />
            </ErrorBoundary>
          </Suspense>

          {/* INFINITE FEED  */}
          <Suspense fallback={<InfiniteFeedViewLoadingStatus />}>
            <ErrorBoundary fallback={<p>Something went wrong Infininte</p>}>
              <InfiniteFeedView />
            </ErrorBoundary>
          </Suspense>

          <Footer />
        </div>
      </div>
    </HydrationBoundary>
  );
};

export default page;
