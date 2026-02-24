'use client';

import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArticleForm } from '@/modules/articles/ui/components/article-form';
import { PhotoPostEdit } from '../components/photo-post-edit';
import { AlbumPostEdit } from '../components/album-post-edit';

export const PostEditView = ({ slug }: { slug: string }) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.posts.getOne.queryOptions({ slug }));

  return (
    <div className='px-4 md:px-8 py-4 md:py-6'>
      {data.type === 'ARTICLE' && <ArticleForm post={data} />}
      {data.type === 'PHOTO' && <PhotoPostEdit post={data} />}
      {data.type === 'ALBUM' && <AlbumPostEdit post={data} />}
    </div>
  );
};
