import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { ErrorBoundary } from 'react-error-boundary';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { FeedView, LoadingStatus } from '@/modules/feed/ui/views/feed-view';

export const metadata = {
  title: 'Travel',
  description:
    'Browse travel photography by city. Explore beautiful destinations and discover photos from around the world.',
};

const page = () => {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.travel.getCitySets.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<LoadingStatus />}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <FeedView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default page;
