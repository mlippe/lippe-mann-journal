import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/trpc/server';
import { trpc } from '@/trpc/server';
import { type PostGetPublished } from '@/modules/posts/types';

import Footer from '@/components/footer';
import {
  InfiniteFeedView,
  InfiniteFeedViewLoadingStatus,
} from '@/modules/home/ui/views/infinite-feed-view';
import IntroCard from '@/modules/home/ui/components/intro-card';

export const dynamic = 'force-dynamic';

const page = () => {
  return (
    <div className='flex flex-col w-full'>
      <div className='w-full lg:mt-16  mt-10 pb-3'>
        {/* INTRO CARD  */}
        <IntroCard />

        {/* FEATURED COLLECTIONS  */}
        {/* ... (commented out code) ... */}

        {/* INFINITE FEED  */}
        <Suspense fallback={<InfiniteFeedViewLoadingStatus />}>
          <ErrorBoundary
            fallback={
              <p>
                Something went wrong while showing the infinite feed, please
                try again.
              </p>
            }
          >
            <InfiniteFeedSuspense />
          </ErrorBoundary>
        </Suspense>

        <Footer />
      </div>
    </div>
  );
};

async function InfiniteFeedSuspense() {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery({
    ...trpc.posts.getPublished.infiniteQueryOptions({ limit: 5 }),
    getNextPageParam: (lastPage: PostGetPublished) => lastPage.nextCursor,
    initialPageParam: 1,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InfiniteFeedView />
    </HydrationBoundary>
  );
}

export default page;
