import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient, trpc } from '@/trpc/server';
import { PhotographView, LoadingState } from './photograph-view';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
          <div className='flex flex-col gap-4 justify-center items-center pt-6 pb-10 border-t -mx-3 mt-4'>
            <p>Want to see more?</p>
            <Button asChild>
              <Link href='/'>See all posts</Link>
            </Button>
          </div>
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};
