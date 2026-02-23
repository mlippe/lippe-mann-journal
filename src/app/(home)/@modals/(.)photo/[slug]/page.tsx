import {
  LoadingState,
  PhotographView,
} from '@/modules/photograph/ui/views/photograph-view';
import { getQueryClient } from '@/trpc/server';
import { trpc } from '@/trpc/server';
import { HydrationBoundary } from '@tanstack/react-query';
import { dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function HomePageModalsSlotPhotoInterceptor({
  params,
}: Props) {
  const slug = (await params).slug;
  const queryClient = getQueryClient();
  const post = await queryClient.fetchQuery(
    trpc.posts.getOne.queryOptions({ slug }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<LoadingState />}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <PhotographView post={post} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
}
