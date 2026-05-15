import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { CollectionForm } from '@/modules/collections/ui/components/collection-form';

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Page = async ({ params }: Props) => {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const queryClient = getQueryClient();
  const collection = await queryClient.fetchQuery(
    trpc.collections.getCollectionBySlug.queryOptions({
      slug: decodedSlug,
    }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='py-4 px-4 md:px-8'>
        <h1 className='text-2xl font-bold mb-6'>Edit Collection: {collection.name}</h1>
        <Suspense fallback={<p>Loading...</p>}>
          <CollectionForm collection={collection} />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
};

export default Page;
