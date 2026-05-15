import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { ErrorBoundary } from 'react-error-boundary';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Footer from '@/components/footer';
import { CollectionCard } from '@/modules/collections/ui/components/collection-card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Sammlungen',
  description: ' Schau Dir alle Sammlungen an, die es in diesem Journal gibt.',
};

const AllCollectionsView = async () => {
  const queryClient = getQueryClient();
  const collections = await queryClient.fetchQuery(
    trpc.collections.getAllCollections.queryOptions({}),
  );

  return (
    <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  );
};

const CollectionsLoading = () => {
  return (
    <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className='space-y-4'>
          <Skeleton className='aspect-video w-full rounded-2xl' />
          <div className='space-y-2 px-2'>
            <Skeleton className='h-6 w-1/2' />
            <Skeleton className='h-4 w-full' />
          </div>
        </div>
      ))}
    </div>
  );
};

const page = async () => {
  const queryClient = getQueryClient();
  // Prefetch all collections
  void queryClient.prefetchQuery(
    trpc.collections.getAllCollections.queryOptions({}),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='flex flex-col w-full'>
        <div className='w-full lg:mt-16 mt-10 pb-3 px-4 md:px-0 max-w-420 mx-auto'>
          <div className='mb-12 flex flex-col items-center'>
            <h1 className='text-xl font-medium text-center'>Sammlungen</h1>
            <p className='mt-2 text-foreground text-sm  md:text-base max-w-xl text-center font-light'>
              Schau Dir alle Sammlungen an, die es in diesem Journal gibt.
            </p>
          </div>

          <Suspense fallback={<CollectionsLoading />}>
            <ErrorBoundary fallback={<p>Error loading collections.</p>}>
              <AllCollectionsView />
            </ErrorBoundary>
          </Suspense>

          <div className='mt-16'>
            <Footer />
          </div>
        </div>
      </div>
    </HydrationBoundary>
  );
};

export default page;
