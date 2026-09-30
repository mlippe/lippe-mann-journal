'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { IconCamera, IconArrowUpRight, IconArrowRight } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';

import { type PostWithPhotos } from '@/db/schema';
import { useTRPC } from '@/trpc/client';
import BlurImage from '@/components/blur-image';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { Button } from '@/components/ui/button';

interface FeedPreviewProps {
  excludeSlug?: string;
  limit?: number;
}

interface ZinePreviewCardProps {
  post: PostWithPhotos;
  priority?: boolean;
}

export const ZinePreviewCard = ({ post, priority = false }: ZinePreviewCardProps) => {
  const photos = post.postsToPhotos?.map((ptp) => ptp.photo) || [];
  const photoCount = photos.length > 0 ? photos.length : post.coverImage ? 1 : 0;
  const coverPhoto =
    photos.length > 0
      ? photos[0]
      : post.coverImage
        ? {
            url: post.coverImage,
            aspectRatio: 1.5,
            blurData: '',
            title: post.title,
          }
        : null;

  const formattedDate = post.createdAt
    ? format(new Date(post.createdAt), 'dd. MMMM yyyy', { locale: de })
    : '';

  const cleanContent = useMemo(() => {
    if (!post.content) return '';
    return post.content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }, [post.content]);

  const href =
    post.type?.toLowerCase() === 'photo'
      ? `/photo/${post.slug}`
      : `/album/${post.slug}`;

  return (
    <Link
      href={href}
      className='group flex flex-col justify-between h-full select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs'
    >
      <div className='flex flex-col'>
        {/* 1. PHOTOGRAPHIC COVER PLATE */}
        <div className='w-full relative overflow-hidden bg-muted/20 border border-border/40 group-hover:border-foreground/30 rounded-xs aspect-[3/2] transition-all duration-500 ease-out group-hover:-translate-y-0.5'>
          {coverPhoto ? (
            <BlurImage
              src={keyToUrl(coverPhoto.url)}
              alt={coverPhoto.title || post.title}
              fill
              blurhash={coverPhoto.blurData}
              aspectRatio={coverPhoto.aspectRatio || 1.5}
              priority={priority}
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px'
              className='object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.03]'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground'>
              <IconCamera className='size-8 opacity-40' />
            </div>
          )}

          {/* Badge: Photo count */}
          <div className='absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur-md border border-border/50 text-[10px] font-mono tracking-wider text-muted-foreground group-hover:text-foreground transition-colors'>
            {photoCount > 1
              ? `${String(photoCount).padStart(2, '0')} FOTOS`
              : '01 FOTO'}
          </div>
        </div>

        {/* 2. EDITORIAL METADATA & HEADLINE */}
        <div className='pt-3 space-y-1.5 flex-1'>
          <div className='flex items-center gap-2 text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-muted-foreground'>
            <span>{formattedDate}</span>
            {post.tags && post.tags.length > 0 && (
              <>
                <span className='text-muted-foreground/40'>•</span>
                <span className='truncate'>{post.tags[0]}</span>
              </>
            )}
          </div>

          <h4 className='text-base sm:text-lg font-serif tracking-tight text-foreground group-hover:text-foreground/80 transition-colors line-clamp-2 leading-snug'>
            {post.title}
          </h4>

          {cleanContent && (
            <p className='text-xs sm:text-[13px] font-serif italic text-muted-foreground/80 line-clamp-2 leading-relaxed pt-0.5'>
              {cleanContent}
            </p>
          )}
        </div>
      </div>

      {/* 3. DISCOVER CUE */}
      <div className='pt-3 flex items-center gap-1 text-[11px] font-mono tracking-wider uppercase text-muted-foreground/60 group-hover:text-foreground transition-colors mt-auto'>
        <span>Geschichte ansehen</span>
        <IconArrowUpRight className='size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
      </div>
    </Link>
  );
};

export const FeedPreviewSkeleton = ({ limit = 3 }: { limit?: number }) => (
  <section className='w-full max-w-6xl mx-auto pt-14 md:pt-20 border-t border-border/40'>
    {/* Section Header Skeleton */}
    <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-12'>
      <div className='space-y-2'>
        <div className='h-3 w-28 bg-muted/60 rounded-xs animate-pulse' />
        <div className='h-7 w-64 bg-muted/60 rounded-xs animate-pulse' />
      </div>
      <div className='h-4 w-36 bg-muted/60 rounded-xs animate-pulse' />
    </div>

    {/* 3 Cards Skeleton */}
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8'>
      {Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
        <div key={i} className='flex flex-col space-y-3'>
          <div className='w-full aspect-[3/2] bg-muted/40 rounded-xs animate-pulse border border-border/30' />
          <div className='space-y-2 pt-1'>
            <div className='h-3 w-32 bg-muted/50 rounded-xs animate-pulse' />
            <div className='h-5 w-4/5 bg-muted/60 rounded-xs animate-pulse' />
            <div className='h-3.5 w-full bg-muted/40 rounded-xs animate-pulse' />
          </div>
        </div>
      ))}
    </div>
  </section>
);

export const FeedPreview = ({ excludeSlug, limit = 3 }: FeedPreviewProps) => {
  const trpc = useTRPC();
  const maxPosts = Math.min(limit, 3);

  const { data, isLoading } = useQuery(
    trpc.posts.getPublished.queryOptions({
      limit: maxPosts + 1, // Fetch one extra in case the current one is included
    }),
  );

  const posts = (data?.items as PostWithPhotos[]) || [];
  const filteredPosts = posts
    .filter((post) => post.slug !== excludeSlug)
    .slice(0, maxPosts);

  if (isLoading) {
    return <FeedPreviewSkeleton limit={maxPosts} />;
  }

  if (filteredPosts.length === 0) {
    return null;
  }

  return (
    <section className='w-full max-w-6xl mx-auto pt-14 md:pt-20 border-t border-border/40'>
      {/* Editorial Section Header */}
      <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-12'>
        <div>
          <p className='text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-muted-foreground mb-1'>
            Aus dem Journal
          </p>
          <h3 className='text-2xl sm:text-3xl font-serif tracking-tight text-foreground'>
            Weitere Serien & Geschichten
          </h3>
        </div>

        <Link
          href='/'
          className='inline-flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors group/link w-fit'
        >
          <span>Alle Einträge ansehen</span>
          <IconArrowRight className='size-3.5 transition-transform duration-300 group-hover/link:translate-x-1' />
        </Link>
      </div>

      {/* Responsive 3-Card Grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8'>
        {filteredPosts.map((post, i) => (
          <ZinePreviewCard key={post.id} post={post} priority={i === 0} />
        ))}
      </div>

      {/* Bottom Editorial Callout */}
      <div className='mt-12 md:mt-16 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left'>
        <p className='text-xs font-serif italic text-muted-foreground'>
          Dokumentarische Streifzüge, Notizen und Serien aus dem Alltag.
        </p>
        <Button
          asChild
          variant='outline'
          className='rounded-full px-6 text-xs font-mono uppercase tracking-widest border-border/70 hover:bg-muted'
        >
          <Link href='/'>
            Zum vollständigen Zine
          </Link>
        </Button>
      </div>
    </section>
  );
};
