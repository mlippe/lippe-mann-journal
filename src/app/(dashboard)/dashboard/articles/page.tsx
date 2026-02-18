import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import type { SearchParams } from 'nuqs/server';
import { ErrorBoundary } from 'react-error-boundary';
import { loadSearchParams } from '@/modules/articles/params';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import {
  DashboardArticlesView,
  ErrorStatus,
  LoadingStatus,
} from '@/modules/articles/ui/views/dashboard-articles-view';
import { ArticlesListHeader } from '@/modules/articles/ui/components/articles-list-header';

export const metadata = {
  title: 'Articles',
  description: 'Articles',
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
      <ArticlesListHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<LoadingStatus />}>
          <ErrorBoundary fallback={<ErrorStatus />}>
            <DashboardArticlesView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
};

export default page;
