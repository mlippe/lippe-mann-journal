'use client';

import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import Footer from '@/components/footer';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import RichTextViewer from '@/components/editor/rich-text-viewer';
import { format } from 'date-fns';
import { FeedPreview } from '@/modules/home/ui/components/feed-preview';
import BlurImage from '@/components/blur-image';

export const ArticleSlugView = ({ slug }: { slug: string }) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.posts.getOne.queryOptions({ slug }));

  const aspectRatio =
    data.coverImageWidth && data.coverImageHeight
      ? data.coverImageWidth / data.coverImageHeight
      : undefined;

  return (
    <div className='mt-16 flex flex-col gap-4 pb-6 items-center'>
      <div className='max-w-4xl w-full'>
        {data.coverImage && (
          <div className='w-full mb-5 bg-foreground/10'>
            <BlurImage
              src={keyToUrl(data.coverImage) || '/placeholder.svg'}
              alt={data.title}
              width={data.coverImageWidth || 896}
              height={data.coverImageHeight || 400}
              blurhash={data.coverImageBlurData || ''}
              aspectRatio={aspectRatio}
              quality={75}
              className='w-full max-h-screen object-contain'
            />
          </div>
        )}

        {/* CONTENT  */}
        <div className=''>
          <span className='text-base text-foreground/80 mb-2 block'>
            {format(data.createdAt, 'dd.MM.yyyy')}
          </span>
          <h1 className='text-4xl tracking-tight lg:text-5xl mb-6 font-bold'>
            {data.title}
          </h1>
        </div>

        {/* POST PREVIEW */}
        <div className='-mx-3'>
          <RichTextViewer content={data.content || ''} />
        </div>
      </div>
      <FeedPreview excludeSlug={slug} />
      <div className='mt-10 w-full'>
        <Footer />
      </div>
    </div>
  );
};
