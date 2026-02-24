import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient, trpc } from '@/trpc/server';
import { PhotographView, LoadingState } from './photograph-view';
import { FeedPreview } from '@/modules/home/ui/components/feed-preview';

interface PhotographDetailPageProps {
  slug: string;
  isModal?: boolean;
}

export const PhotographDetailPage = async ({
  slug,
  isModal = false,
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
          {!isModal && (
            <div className='mt-4'>
              <FeedPreview excludeSlug={slug} />
            </div>
          )}
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};
