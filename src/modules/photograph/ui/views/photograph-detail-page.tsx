import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient, trpc } from '@/trpc/server';
import { PhotographView, LoadingState } from './photograph-view';
import { InfiniteFeedView } from '@/modules/home/ui/views/infinite-feed-view';

interface PhotographDetailPageProps {
  slug: string;
  isModal?: boolean;
  showFeed?: boolean;
}

export const PhotographDetailPage = async ({ 
  slug, 
  isModal = false,
  showFeed = false 
}: PhotographDetailPageProps) => {
  const queryClient = getQueryClient();
  const post = await queryClient.fetchQuery(
    trpc.posts.getOne.queryOptions({ slug }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<LoadingState />}>
        <ErrorBoundary fallback={<p>Error loading post.</p>}>
          <PhotographView post={post} isModal={isModal} />
          {showFeed && <InfiniteFeedView />}
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};
