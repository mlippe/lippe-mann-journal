'use client';

import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Footer from '@/components/footer';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import RichTextViewer from '@/components/editor/rich-text-viewer';
import { format } from 'date-fns';
import { FeedPreview } from '@/modules/home/ui/components/feed-preview';
import { calculateReadingTime } from '@/modules/articles/lib/reading-time';
import { useEffect, useState } from 'react';
import Author from '@/components/author';
import { Separator } from '@/components/ui/separator';
import { siteConfig } from '@/site.config';

export const ArticleSlugView = ({ slug }: { slug: string }) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.posts.getOne.queryOptions({ slug }));
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const readingTime = calculateReadingTime(data.content);

  return (
    <div className='flex flex-col items-center w-full'>
      {/* PROGRESS BAR  */}
      <div className='fixed top-0 left-0 w-full h-1 z-50 bg-muted'>
        <div
          className='h-full bg-primary transition-all duration-150 ease-out'
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <article className='w-full max-w-3xl px-2 lg:px-0 pt-0 lg:pt-15'>
        {/* HEADER SECTION  */}
        <header className='mb-10 lg:mb-16'>
          {data.coverImage && (
            <div className='relative rounded-b-3xl md:rounded-3xl overflow-hidden bg-muted mb-10 -mx-7 flex justify-center'>
              <Image
                src={keyToUrl(data.coverImage) || '/placeholder.svg'}
                alt={data.title}
                width={768}
                height={600}
                className='absolute top-0 left-0 object-cover blur-xl w-full h-full'
              />
              <Image
                src={keyToUrl(data.coverImage) || '/placeholder.svg'}
                alt={data.title}
                width={768}
                height={600}
                priority
                className='relative z-1'
              />
            </div>
          )}
          <h1 className='text-3xl lg:text-5xl font-bold tracking-tight mb-8 leading-[1.1]'>
            {data.title}
          </h1>

          <div className='flex items-center justify-between mb-8 w-full flex-wrap'>
            <div className='flex items-center gap-4 justify-between w-full'>
              <Author size='md' />
              <div className='flex flex-col items-end text-sm text-muted-foreground'>
                <span className='font-medium'>
                  {format(data.createdAt, 'MMM d, yyyy')}
                </span>
                <span>{readingTime} Min Lesezeit</span>
              </div>
            </div>
          </div>
        </header>

        {/* ARTICLE CONTENT  */}
        <div className='max-w-none mb-20 font-sans leading-relaxed text-foreground/90'>
          <RichTextViewer content={data.content || ''} />
        </div>

        <Separator className='mb-8' />

        {/* AUTHOR CARD  */}
        <div className='flex flex-col lg:flex-row gap-6 items-center lg:items-start p-8 rounded-3xl bg-muted/30 border mb-20'>
          <Author size='md' />
          <div className='flex-1 text-center lg:text-left space-y-2'>
            <h3 className='font-bold text-lg'>About {siteConfig.name}</h3>
            <p className='text-muted-foreground font-light leading-relaxed'>
              {siteConfig.bio}
            </p>
          </div>
        </div>
      </article>

      <div className='w-full max-w-420 px-4 lg:px-0'>
        <FeedPreview excludeSlug={slug} />
      </div>

      <div className='mt-20 w-full'>
        <Footer />
      </div>
    </div>
  );
};
