import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { trpc } from '@/trpc/server';
import { getQueryClient } from '@/trpc/server';
import { ErrorBoundary } from 'react-error-boundary';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { PostEditView } from '@/modules/posts/ui/views/post-edit-view';

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
  const post = await queryClient
    .fetchQuery(
      trpc.posts.getOne.queryOptions({
        slug: decodedSlug,
      }),
    )
    .catch(() => null);

  return {
    title: post?.title ?? 'Beitrag nicht gefunden',
  };
}

const Page = async ({ params }: Props) => {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const queryClient = getQueryClient();
  const post = await queryClient
    .fetchQuery(
      trpc.posts.getOne.queryOptions({
        slug: decodedSlug,
      }),
    )
    .catch(() => null);

  if (!post) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<p>Something went wrong</p>}>
        <Suspense fallback={<p>Loading...</p>}>
          <PostEditView slug={decodedSlug} />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
};

export default Page;
