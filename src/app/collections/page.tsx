import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { ErrorBoundary } from 'react-error-boundary';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Footer from '@/components/footer';
import { CollectionCard } from '@/modules/collections/ui/components/collection-card';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sammlungen · Lippe & Mann Journal',
  description:
    'Kuratierte thematische Werkserien, visuelle Notizen und fotografische Archive.',
};

const AllCollectionsView = async () => {
  const queryClient = getQueryClient();
  const collections = await queryClient.fetchQuery(
    trpc.collections.getAllCollections.queryOptions({}),
  );

  if (!collections || collections.length === 0) {
    return (
      <div className='w-full py-20 sm:py-28 flex flex-col items-center justify-center text-center border border-dashed border-border/40 rounded-2xl p-8'>
        <h2 className='text-lg font-medium text-foreground mb-1'>
          Keine Sammlungen vorhanden
        </h2>
        <p className='text-sm text-muted-foreground max-w-sm font-light leading-relaxed'>
          Aktuell wurden noch keine thematischen Sammlungen im Journal
          veröffentlicht.
        </p>
      </div>
    );
  }

  return (
    <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 sm:gap-y-16 items-start'>
      {collections.map((collection, index) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          index={index}
          priority={index < 3}
        />
      ))}
    </div>
  );
};

const CollectionsLoading = () => {
  return (
    <div className='w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 sm:gap-y-16 items-start'>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className='flex flex-col gap-3.5 animate-pulse'>
          <Skeleton className='aspect-[2/3] w-full rounded-xl' />
          <div className='space-y-2 pt-1'>
            <div className='flex justify-between items-center'>
              <Skeleton className='h-4 w-2/5 rounded' />
              <Skeleton className='size-3.5 rounded' />
            </div>
            <Skeleton className='h-3 w-4/5 rounded' />
            <div className='pt-2 border-t border-border/20 mt-1 flex gap-2'>
              <Skeleton className='h-2.5 w-1/4 rounded' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const page = async () => {
  const queryClient = getQueryClient();
  // Prefetch all collections
  const collections = await queryClient.fetchQuery(
    trpc.collections.getAllCollections.queryOptions({}),
  );

  const totalCount = collections?.length ?? 0;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='flex flex-col w-full'>
        <div className='w-full lg:mt-16 mt-10 pb-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Swiss Typographic Masthead */}
          <header className='mb-10 sm:mb-14 lg:mb-16'>
            {/* Main Title & Editorial Subline */}
            <div className='mt-2 sm:mt-4 flex flex-col md:flex-row md:items-end justify-between gap-6'>
              <div className='space-y-2 max-w-2xl'>
                <h1 className='text-3xl sm:text-4xl md:text-5xl font-medium tracking-[-0.03em] text-foreground leading-[1.08]'>
                  Sammlungen
                </h1>
                <p className='text-sm sm:text-base text-muted-foreground font-light leading-relaxed max-w-xl'>
                  Thematische Gruppierung meiner Posts. Ich gebe mir Mühe
                  Struktur in meine Arbeit zu bringen, aber lerne noch.
                </p>
              </div>

              <div className='hidden md:flex items-center gap-2 text-xs font-mono text-muted-foreground/60 uppercase tracking-widest shrink-0'>
                <span>
                  Index 01&ndash;
                  {String(Math.max(totalCount, 1)).padStart(2, '0')}
                </span>
              </div>
            </div>
          </header>

          {/* Grid of Collections */}
          <Suspense fallback={<CollectionsLoading />}>
            <ErrorBoundary
              fallback={
                <p className='text-center py-12 text-sm text-muted-foreground'>
                  Fehler beim Laden der Sammlungen.
                </p>
              }
            >
              <AllCollectionsView />
            </ErrorBoundary>
          </Suspense>

          {/* Footer */}
          <div className='mt-20 sm:mt-28'>
            <Footer />
          </div>
        </div>
      </div>
    </HydrationBoundary>
  );
};

export default page;
