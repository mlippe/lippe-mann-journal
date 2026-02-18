import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { ErrorBoundary } from 'react-error-boundary';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Footer from '@/components/footer';
import { Collection } from '@/db/schema';
import CityCard from '@/modules/home/ui/components/city-card'; // Reusing CityCard for collections

export const metadata = {
  title: 'Collections',
  description: 'Browse all photo collections.',
};

const AllCollectionsView = async () => {
  // const collections = await trpc.collections.getAllCollections();

  return (
    <div className='w-full grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 p-3'>
      {/* {collections.map((collection: Collection) => (
        <CityCard key={collection.id} collection={collection} />
      ))} */}
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
      <div className='flex flex-col min-h-screen w-full'>
        <div className='py-4 px-4 md:px-8'>
          <h1 className='text-3xl font-bold mb-4'>All Collections</h1>
          <Suspense fallback={<p>Loading collections...</p>}>
            <ErrorBoundary fallback={<p>Error loading collections.</p>}>
              <AllCollectionsView />
            </ErrorBoundary>
          </Suspense>
        </div>
        <Footer />
      </div>
    </HydrationBoundary>
  );
};

export default page;
