import { Suspense } from 'react';
import Link from 'next/link';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { ErrorBoundary } from 'react-error-boundary';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { type CollectionGetPostsInCollection } from '@/modules/collections/types';
import Footer from '@/components/footer';
import {
  InfiniteFeedView,
  InfiniteFeedViewLoadingStatus,
} from '@/modules/home/ui/views/infinite-feed-view';
import { getOptimizedImageUrl } from '@/lib/images';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ collectionSlug: string }>;
}) => {
  try {
    const { collectionSlug } = await params;
    const queryClient = getQueryClient();
    const collection = await queryClient.fetchQuery(
      trpc.collections.getCollectionBySlug.queryOptions({
        slug: collectionSlug,
      }),
    );

    const imageUrl = collection?.coverImageUrl
      ? getOptimizedImageUrl(keyToUrl(collection.coverImageUrl))
      : undefined;

    const description = collection?.description
      ? collection.description
      : collection
        ? `Schau dir die Sammlung "${collection.name}" im Lippe & Mann Journal an.`
        : 'Schau dir meine Sammlung im Lippe & Mann Journal an.';

    return {
      title: `${collection?.name || 'Sammlung'} · Lippe & Mann Journal`,
      description,
      openGraph: {
        title: `${collection?.name || 'Sammlung'} · Lippe & Mann Journal`,
        description,
        images: imageUrl ? [{ url: imageUrl }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${collection?.name || 'Sammlung'} · Lippe & Mann Journal`,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Sammlung · Lippe & Mann Journal',
    };
  }
};

const CollectionHeaderSkeleton = () => {
  return (
    <div className='max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 mb-8 sm:mb-12 pt-2 sm:pt-4 animate-pulse'>
      <div className='flex items-center justify-between pb-3 border-b border-border/30'>
        <Skeleton className='h-3 w-36 rounded' />
        <Skeleton className='h-3 w-20 rounded' />
      </div>
      <div className='mt-6 sm:mt-8 md:mt-10 space-y-3 sm:space-y-4'>
        <Skeleton className='h-10 sm:h-12 md:h-14 w-3/5 rounded-lg' />
        <Skeleton className='h-4 w-4/5 max-w-xl rounded' />
      </div>
      <div className='w-full mt-8 sm:mt-10 lg:mt-12 border-b border-border/40' />
    </div>
  );
};

const SingleCollectionView = async ({
  params,
}: {
  params: Promise<{ collectionSlug: string }>;
}) => {
  const { collectionSlug } = await params;

  return (
    <div className='flex flex-col w-full'>
      <div className='w-full lg:mt-12 mt-8 pb-3'>
        {/* Collection Header */}
        <Suspense fallback={<CollectionHeaderSkeleton />}>
          <CollectionHeaderSuspense collectionSlug={collectionSlug} />
        </Suspense>

        {/* Posts in Collection (Infinite Feed) */}
        <div className='w-full'>
          <Suspense fallback={<InfiniteFeedViewLoadingStatus />}>
            <ErrorBoundary
              fallback={
                <p className='text-center py-10 text-sm text-muted-foreground'>
                  Fehler beim Laden der Sammlungsbeiträge.
                </p>
              }
            >
              <InfiniteFeedSuspense collectionSlug={collectionSlug} />
            </ErrorBoundary>
          </Suspense>
        </div>
        <Footer />
      </div>
    </div>
  );
};

async function CollectionHeaderSuspense({
  collectionSlug,
}: {
  collectionSlug: string;
}) {
  const queryClient = getQueryClient();
  const collection = await queryClient.fetchQuery(
    trpc.collections.getCollectionBySlug.queryOptions({ slug: collectionSlug }),
  );

  if (!collection) {
    return (
      <div className='text-center py-10 text-sm text-muted-foreground'>
        Sammlung nicht gefunden.
      </div>
    );
  }

  const postCount = collection.postCount ?? 0;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <header className='max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 mb-8 sm:mb-12 pt-2 sm:pt-4'>
        {/* Top Eyebrow / Breadcrumbs */}
        <div className='flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground/70 pb-3 border-b border-border/30'>
          <div className='flex items-center gap-2'>
            <Link
              href='/collections'
              className='inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group'
            >
              <ArrowLeft className='size-3 text-muted-foreground/60 group-hover:text-foreground group-hover:-translate-x-0.5 transition-all' />
              <span>Sammlungen</span>
            </Link>
            <span className='opacity-40'>/</span>
            <span className='text-foreground/80'>{collection.slug}</span>
          </div>

          <div className='flex items-center gap-3'>
            {collection.isFeatured && (
              <span className='px-1.5 py-0.5 rounded-full bg-muted/40 border border-border/40 text-[10px] text-foreground font-mono'>
                Featured
              </span>
            )}
            <span>
              {postCount > 0
                ? `${postCount} ${postCount === 1 ? 'Eintrag' : 'Einträge'}`
                : 'Serie'}
            </span>
          </div>
        </div>

        {/* Main Title & Editorial Text Block */}
        <div className='mt-6 sm:mt-8 md:mt-10 flex flex-col md:flex-row md:items-end justify-between gap-6'>
          <div className='space-y-3 sm:space-y-4 max-w-3xl'>
            <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-medium tracking-[-0.03em] text-foreground leading-[1.08]'>
              {collection.name}
            </h1>
            {collection.description && (
              <p className='text-base sm:text-lg text-muted-foreground font-light leading-relaxed max-w-2xl'>
                {collection.description}
              </p>
            )}
          </div>

          {/* Right Column: Archival Stamp */}
          <div className='hidden md:flex flex-col items-end text-right font-mono text-xs text-muted-foreground/60 shrink-0 gap-1 pb-1'>
            <span className='tracking-wider uppercase'>
              Lippe &amp; Mann Journal
            </span>
            {collection.updatedAt && (
              <span className='text-[11px] opacity-80'>
                Aktualisiert{' '}
                {format(new Date(collection.updatedAt), 'MMM yyyy', {
                  locale: de,
                })}
              </span>
            )}
          </div>
        </div>

        {/* Hairline Divider before Stream */}
        <div className='w-full mt-8 sm:mt-10 lg:mt-12 border-b border-border/40' />
      </header>
    </HydrationBoundary>
  );
}

async function InfiniteFeedSuspense({
  collectionSlug,
}: {
  collectionSlug: string;
}) {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery({
    ...trpc.collections.getPostsInCollection.infiniteQueryOptions({
      collectionSlug,
      limit: 6,
    }),
    getNextPageParam: (lastPage: CollectionGetPostsInCollection) =>
      lastPage.nextCursor,
    initialPageParam: 1,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InfiniteFeedView collectionSlug={collectionSlug} />
    </HydrationBoundary>
  );
}

export default SingleCollectionView;
