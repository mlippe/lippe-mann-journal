'use client';

import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Footer from '@/components/footer';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import RichTextViewer from '@/components/editor/rich-text-viewer';
import { format } from 'date-fns';
import { FeedPreview } from '@/modules/home/ui/components/feed-preview';

export const ArticleSlugView = ({ slug }: { slug: string }) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.posts.getOne.queryOptions({ slug }));

  return (
    <div className='mt-16 flex flex-col gap-4 pb-6 items-center'>
      <div className='max-w-4xl w-full'>
        {data.coverImage && (
          <Image
            src={keyToUrl(data.coverImage) || '/placeholder.svg'}
            alt='Image'
            width={896}
            height={400}
            quality={75}
            className='w-full max-h-screen object-contain mb-5'
          />
        )}

        {/* CONTENT  */}
        <div className='px-3'>
          <span className='text-base text-foreground/80 mb-2 block'>
            {format(data.createdAt, 'dd.MM.yyyy')}
          </span>
          <h1 className='text-4xl tracking-tight lg:text-5xl mb-10 font-bold'>
            {data.title}
          </h1>
        </div>

        {/* POST PREVIEW */}

        <RichTextViewer content={data.content || ''} />
      </div>
      <FeedPreview excludeSlug={slug} />
      <div className='mt-10 w-full'>
        <Footer />
      </div>
    </div>
  );
};
