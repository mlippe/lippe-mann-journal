import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import type { SearchParams } from 'nuqs/server';
import { ErrorBoundary } from 'react-error-boundary';
import { loadSearchParams } from '@/modules/posts/params';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import {
  ErrorStatus,
  LoadingStatus,
} from '@/modules/posts/ui/components/posts-list';
import { DashboardPostsView } from '@/modules/posts/ui/views/dashboard-posts-view';
import { PostsListHeader } from '@/modules/posts/ui/components/posts-list-header';

export const metadata = {
  title: 'Posts',
  description: 'Manage all your posts',
};

type Props = {
  searchParams: Promise<SearchParams>;
};

const page = async ({ searchParams }: Props) => {
  const filters = await loadSearchParams(searchParams);

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.posts.getMany.queryOptions({ ...filters }),
  );

  return (
    <>
      <PostsListHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<LoadingStatus />}>
          <ErrorBoundary fallback={<ErrorStatus />}>
            <DashboardPostsView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
};

export default page;
