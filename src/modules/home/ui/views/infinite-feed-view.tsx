'use client';

import { useMemo } from 'react';
import { type PostWithPhotos } from '@/db/schema';
import { useTRPC } from '@/trpc/client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { type PostGetPublished } from '@/modules/posts/types';
import { type CollectionGetPostsInCollection } from '@/modules/collections/types';
import { PostCard } from '../components/post-card';
import { PostCardSkeleton } from '../components/post-card-skeleton';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { useQueryState, parseAsString } from 'nuqs';
import { FeedViewSwitcher } from '../components/feed-view-switcher';
import { TimelineDivider } from '../components/timeline-divider';
import { ZineFeedItem } from '../components/zine-feed-item';
import { ZinePostSkeleton } from '../components/zine-post-skeleton';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface InfiniteFeedViewProps {
  collectionSlug?: string;
}

type FeedPage = PostGetPublished | CollectionGetPostsInCollection;

export const InfiniteFeedView = ({ collectionSlug }: InfiniteFeedViewProps) => {
  const trpc = useTRPC();
  const [view] = useQueryState('view', parseAsString.withDefault('zine'));

  const queryOptions = collectionSlug
    ? trpc.collections.getPostsInCollection.infiniteQueryOptions({
        collectionSlug,
        limit: 6,
      })
    : trpc.posts.getPublished.infiniteQueryOptions({
        limit: 6,
      });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      ...queryOptions,
      getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor,
      initialPageParam: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 10, // 10 minutes stability
    });

  const { lastElementRef } = useIntersectionObserver({
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  });

  const posts = useMemo(() => {
    return (
      data?.pages
        .flatMap((page) => (page.items as PostWithPhotos[]) || [])
        .filter((post) => post.visibility === 'public') || []
    );
  }, [data?.pages]);

  // Group posts by year-month for timeline dividers in grid mode
  const postsWithDividers = useMemo(() => {
    const monthCounts: Record<string, number> = {};
    for (const post of posts) {
      if (post.createdAt) {
        const key = format(new Date(post.createdAt), 'yyyy-MM');
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      }
    }

    const result: Array<
      | {
          type: 'divider';
          key: string;
          label: string;
          month?: string;
          year?: string;
          count: number;
        }
      | { type: 'post'; post: PostWithPhotos; index: number }
    > = [];

    let currentMonth = '';
    posts.forEach((post, i) => {
      if (post.createdAt) {
        const date = new Date(post.createdAt);
        const monthKey = format(date, 'yyyy-MM');
        if (monthKey !== currentMonth) {
          currentMonth = monthKey;
          const monthName = format(date, 'MMMM', { locale: de });
          const yearName = format(date, 'yyyy');
          const label = `${monthName} ${yearName}`;
          result.push({
            type: 'divider',
            key: `divider-${monthKey}`,
            label,
            month: monthName,
            year: yearName,
            count: monthCounts[monthKey] || 1,
          });
        }
      }
      result.push({ type: 'post', post, index: i });
    });

    return result;
  }, [posts]);

  if (isLoading) {
    return <InfiniteFeedViewLoadingStatus view={view} />;
  }

  return (
    <div className='w-full space-y-8 md:py-8 py-4 max-w-420 mx-auto'>
      <FeedViewSwitcher totalPosts={posts.length} />

      {view === 'zine' ? (
        /* Default Zine Mode: Immersive, Zero-Crop Magazine Reading View */
        <div className='max-w-5xl lg:max-w-6xl mx-auto'>
          {posts.map((post, i) => (
            <div
              key={post.id}
              ref={i === posts.length - 1 ? lastElementRef : null}
            >
              <ZineFeedItem post={post} priority={i === 0} />
            </div>
          ))}
        </div>
      ) : (
        /* Grid Mode: 3-column chronological grid with monthly timeline markers */
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-muted gap-3 md:gap-[0.06rem] border-muted border-y-12 md:border-y -mx-3 md:mx-0'>
          {postsWithDividers.map((item) => {
            if (item.type === 'divider') {
              return (
                <TimelineDivider
                  key={item.key}
                  label={item.label}
                  month={item.month}
                  year={item.year}
                  count={item.count}
                />
              );
            }
            return (
              <div
                key={item.post.id}
                ref={item.index === posts.length - 1 ? lastElementRef : null}
              >
                <PostCard post={item.post} index={item.index} />
              </div>
            );
          })}
        </div>
      )}

      {isFetchingNextPage && <InfiniteFeedViewLoadingStatus view={view} />}
    </div>
  );
};

export const InfiniteFeedViewLoadingStatus = ({
  view = 'zine',
}: {
  view?: string;
} = {}) => {
  return (
    <div className='w-full space-y-8 md:py-8 py-4 max-w-420 mx-auto'>
      {view === 'zine' ? (
        <div className='max-w-4xl mx-auto'>
          {Array.from({ length: 3 }).map((_, index) => (
            <ZinePostSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-muted gap-3 md:gap-[0.06rem] border-muted border-y-12 md:border-y -mx-3 md:mx-0'>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className='w-full relative'>
              <PostCardSkeleton />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
