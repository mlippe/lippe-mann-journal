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
import { Skeleton } from '@/components/ui/skeleton';
import { siteConfig } from '@/site.config';
import { getOptimizedImageUrl } from '@/lib/images';

export const ArticleSkeleton = () => {
  return (
    <div className='flex flex-col items-center -mt-3 w-full'>
      <article className='w-full lg:px-4 animate-pulse'>
        {/* HEADER SECTION SKELETON */}
        <header className='mb-10 lg:mb-16'>
          <div className='relative overflow-hidden bg-muted mb-10 flex justify-center rounded-b-xl lg:rounded-b-4xl h-100 lg:h-150'>
            <Skeleton className='w-full h-full animate-shimmer' />
          </div>
          <div className='max-w-3xl mx-auto px-2'>
            <Skeleton className='h-10 lg:h-14 w-3/4 mb-8' />

            <div className='flex items-center justify-between mb-8 w-full flex-wrap'>
              <div className='flex items-center gap-4 justify-between w-full'>
                <div className='flex items-center gap-3'>
                  <Skeleton className='size-10 rounded-full' />
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-24' />
                  </div>
                </div>
                <div className='flex flex-col items-end gap-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-4 w-20' />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ARTICLE CONTENT SKELETON */}
        <div className='mb-20 max-w-3xl mx-auto px-2 space-y-4'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-[95%]' />
          <Skeleton className='h-4 w-[98%]' />
          <Skeleton className='h-4 w-[92%]' />
          <Skeleton className='h-4 w-full' />
          <div className='pt-4'>
            <Skeleton className='h-4 w-[88%]' />
          </div>
          <Skeleton className='h-4 w-[94%]' />
          <Skeleton className='h-4 w-[96%]' />
        </div>
      </article>
    </div>
  );
};

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
    <div className='flex flex-col items-center -mt-3 w-full'>
      {/* PROGRESS BAR  */}
      <div className='fixed top-0 left-0 w-full h-1 z-50 bg-muted/20'>
        <div
          className='h-full bg-primary transition-all duration-150 ease-out'
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <article className='w-full lg:px-4 '>
        {/* HEADER SECTION  */}
        <header className='mb-10 lg:mb-16'>
          {data.coverImage && (
            <div className='relative  overflow-hidden bg-muted mb-10 flex justify-center rounded-b-xl lg:rounded-b-4xl'>
              <Image
                src={
                  getOptimizedImageUrl(keyToUrl(data.coverImage), 100) ||
                  '/placeholder.svg'
                }
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
                sizes='(max-width: 768px) 100vw, 768px'
                className='relative z-1 w-auto h-auto'
              />
            </div>
          )}
          <div className='max-w-3xl mx-auto px-2'>
            <h1 className='text-3xl lg:text-5xl font-bold tracking-tight mb-8 leading-[1.1] '>
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
          </div>
        </header>

        {/* ARTICLE CONTENT  */}
        <div className='mb-20 font-sans leading-relaxed text-foreground/90 max-w-3xl mx-auto px-2'>
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
