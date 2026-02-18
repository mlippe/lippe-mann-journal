'use client';

import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArticleForm } from '../components/article-form';

export const ArticleView = ({ slug }: { slug: string }) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.posts.getOne.queryOptions({ slug }));
  return (
    <div className='px-4 md:px-8 py-4 md:py-6'>
      <ArticleForm post={data} />
    </div>
  );
};
