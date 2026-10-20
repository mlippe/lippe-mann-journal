import { Metadata } from 'next';
import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { ErrorBoundary } from 'react-error-boundary';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SessionRevisitView } from '@/modules/sessions/ui/views/session-revisit-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const decodedSlug = decodeURIComponent(slug);

  const queryClient = getQueryClient();
  const post = await queryClient.fetchQuery(
    trpc.posts.getOne.queryOptions({
      slug: decodedSlug,
    }),
  );

  return {
    title: `Neuauswahl · ${post.title}`,
  };
}

const Page = async ({ params }: Props) => {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const queryClient = getQueryClient();
  await queryClient.fetchQuery(
    trpc.posts.getOne.queryOptions({
      slug: decodedSlug,
    }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<p>Fehler beim Laden der Session</p>}>
        <Suspense fallback={<p>Lade Session-Kontaktbogen...</p>}>
          <SessionRevisitView slug={decodedSlug} />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
};

export default Page;
