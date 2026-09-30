import { ErrorBoundary } from 'react-error-boundary';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient, trpc } from '@/trpc/server';
import { EditorialStoryView } from './editorial-story-view';
import { FeedPreview } from '@/modules/home/ui/components/feed-preview';

interface PhotographDetailPageProps {
  slug: string;
  isModal?: boolean;
}

export const PhotographDetailPage = async ({
  slug,
  isModal = false,
}: PhotographDetailPageProps) => {
  const queryClient = getQueryClient();
  const post = await queryClient.fetchQuery(
    trpc.posts.getOne.queryOptions({ slug }),
  );

  if (post?.id) {
    await queryClient.prefetchQuery(
      trpc.social.getInteractions.queryOptions({ postId: post.id }),
    );
  }

  if (!isModal) {
    await queryClient.prefetchQuery(
      trpc.posts.getPublished.queryOptions({ limit: 4 }),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<p className='text-center py-20 font-mono text-sm text-muted-foreground'>Eintrag konnte nicht geladen werden.</p>}>
        <EditorialStoryView post={post} />
        {!isModal && (
          <div className='mt-16'>
            <FeedPreview excludeSlug={slug} />
          </div>
        )}
      </ErrorBoundary>
    </HydrationBoundary>
  );
};
