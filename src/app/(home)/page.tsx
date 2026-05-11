import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

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
        {/* <Suspense fallback={<FeaturedCollectionsViewLoadingStatus />}>
            <ErrorBoundary
              fallback={
                <p>
                  Something went wrong while showing featured collections,
                  please try again.
                </p>
              }
            >
              <FeaturedCollectionsView />
            </ErrorBoundary>
          </Suspense> */}

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
  return (
    <InfiniteFeedView />
  );
}

export default page;
