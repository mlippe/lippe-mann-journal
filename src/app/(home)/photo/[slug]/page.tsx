import { Metadata } from 'next';
import { getQueryClient } from '@/trpc/server';
import { trpc } from '@/trpc/server';
import { HydrationBoundary } from '@tanstack/react-query';
import { dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  LoadingState,
  PhotographView,
} from '@/modules/photograph/ui/views/photograph-view';
import { InfiniteFeedView } from '@/modules/home/ui/views/infinite-feed-view';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const queryClient = getQueryClient();
  const data = await queryClient.fetchQuery(
    trpc.posts.getOne.queryOptions({ slug }),
  );

  return {
    title: data.title,
  };
}

const page = async ({ params }: Props) => {
  const slug = (await params).slug;
  const queryClient = getQueryClient();
  const post = await queryClient.fetchQuery(
    trpc.posts.getOne.queryOptions({ slug }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<LoadingState />}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <PhotographView post={post} isModal={false} />
          <InfiniteFeedView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default page;
