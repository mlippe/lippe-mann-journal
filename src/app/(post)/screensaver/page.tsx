import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { ErrorBoundary } from 'react-error-boundary';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { ScreensaverView } from '@/modules/photograph/ui/views/screensaver-view';

export const metadata = {
  title: 'Screensaver',
  description: 'Screensaver',
};

const page = () => {
  return <span>Hello</span>;

  // const queryClient = getQueryClient();
  // void queryClient.prefetchQuery(
  //   trpc.photos.getMany.queryOptions({ page: 1, pageSize: 100 }),
  // );

  //  (
  //   <HydrationBoundary state={dehydrate(queryClient)}>
  //     <Suspense fallback={<p>Loading...</p>}>
  //       <ErrorBoundary fallback={<p>Error</p>}>hello</ErrorBoundary>
  //     </Suspense>
  //   </HydrationBoundary>
  // );
};

export default page;
