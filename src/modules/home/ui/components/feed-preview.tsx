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

type PreviewPhoto = {
  id?: string;
  url: string;
  title?: string | null;
  aspectRatio?: number | null;
  width?: number | null;
  height?: number | null;
  blurData?: string | null;
};

const getPhotoRatio = (photo?: PreviewPhoto): number => {
  if (!photo) return 1.5;
  if (typeof photo.aspectRatio === 'number' && photo.aspectRatio > 0) {
    return photo.aspectRatio;
  }
  if (photo.width && photo.height && photo.height > 0) {
    return photo.width / photo.height;
  }
  return 1.5;
};

interface ZineCardCollageProps {
  photos: PreviewPhoto[];
  totalCount: number;
  title: string;
  priority?: boolean;
}

const ZineCardCollage = ({
  photos,
  totalCount,
  title,
  priority = false,
}: ZineCardCollageProps) => {
  if (photos.length === 0) {
    return (
      <div className='w-full aspect-[3/2] flex items-center justify-center bg-muted/20 border border-border/40 rounded-xs text-muted-foreground'>
        <IconCamera className='size-8 opacity-40' />
      </div>
    );
  }

  // 1 PHOTO
  if (photos.length === 1) {
    const r = getPhotoRatio(photos[0]);
    const clampedR = Math.max(0.67, Math.min(1.8, r));

    return (
      <div
        className='w-full relative overflow-hidden bg-muted/20 border border-border/40 group-hover:border-foreground/30 rounded-xs transition-all duration-500 ease-out group-hover:-translate-y-0.5'
        style={{ aspectRatio: `${clampedR}` }}
      >
        <BlurImage
          src={keyToUrl(photos[0].url)}
          alt={photos[0].title || title}
          fill
          blurhash={photos[0].blurData}
          aspectRatio={r}
          priority={priority}
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px'
          className='object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.025]'
        />
        <div className='absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur-md border border-border/50 text-[10px] font-mono tracking-[0.16em] text-muted-foreground group-hover:text-foreground transition-colors z-20 pointer-events-none tabular-nums'>
          01 FOTO
        </div>
      </div>
    );
  }

  // 2 PHOTOS (DIPTYCH SPREAD)
  if (photos.length === 2) {
    const r1 = getPhotoRatio(photos[0]);
    const r2 = getPhotoRatio(photos[1]);
    const rSide = r1 + r2;
    const rStack = 1 / (1 / r1 + 1 / r2);
    const isSide = Math.abs(rSide - 1.25) <= Math.abs(rStack - 1.25);
    const totalRatio = isSide ? rSide : rStack;
    const clampedRatio = Math.max(0.75, Math.min(2.1, totalRatio));

    return (
      <div
        className='w-full relative overflow-hidden bg-muted/20 border border-border/40 group-hover:border-foreground/30 rounded-xs transition-all duration-500 ease-out group-hover:-translate-y-0.5'
        style={{ aspectRatio: `${clampedRatio}` }}
      >
        {isSide ? (
          <div className='flex gap-1 w-full h-full p-0.5 bg-border/20'>
            <div
              className='relative h-full overflow-hidden bg-muted/15 rounded-[1px]'
              style={{ flex: `${r1} 1 0%` }}
            >
              <BlurImage
                src={keyToUrl(photos[0].url)}
                alt={photos[0].title || `${title} - 1`}
                fill
                blurhash={photos[0].blurData}
                aspectRatio={r1}
                priority={priority}
                sizes='(max-width: 768px) 50vw, (max-width: 1200px) 18vw, 190px'
                className='object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.025]'
              />
            </div>
            <div
              className='relative h-full overflow-hidden bg-muted/15 rounded-[1px]'
              style={{ flex: `${r2} 1 0%` }}
            >
              <BlurImage
                src={keyToUrl(photos[1].url)}
                alt={photos[1].title || `${title} - 2`}
                fill
                blurhash={photos[1].blurData}
                aspectRatio={r2}
                sizes='(max-width: 768px) 50vw, (max-width: 1200px) 18vw, 190px'
                className='object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.025]'
              />
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-1 w-full h-full p-0.5 bg-border/20'>
            <div
              className='relative w-full overflow-hidden bg-muted/15 rounded-[1px]'
              style={{ flex: `${1 / r1} 1 0%` }}
            >
              <BlurImage
                src={keyToUrl(photos[0].url)}
                alt={photos[0].title || `${title} - 1`}
                fill
                blurhash={photos[0].blurData}
                aspectRatio={r1}
                priority={priority}
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px'
                className='object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.025]'
              />
            </div>
            <div
              className='relative w-full overflow-hidden bg-muted/15 rounded-[1px]'
              style={{ flex: `${1 / r2} 1 0%` }}
            >
              <BlurImage
                src={keyToUrl(photos[1].url)}
                alt={photos[1].title || `${title} - 2`}
                fill
                blurhash={photos[1].blurData}
                aspectRatio={r2}
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px'
                className='object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.025]'
              />
            </div>
          </div>
        )}

        <div className='absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur-md border border-border/50 text-[10px] font-mono tracking-[0.16em] text-muted-foreground group-hover:text-foreground transition-colors z-20 pointer-events-none tabular-nums'>
          {totalCount > 2
            ? `${String(totalCount).padStart(2, '0')} AUFNAHMEN`
            : '02 AUFNAHMEN'}
        </div>
      </div>
    );
  }

  // 3 PHOTOS (TRIPTYCH / ASYMMETRICAL EDITORIAL COLLAGE)
  const r1 = getPhotoRatio(photos[0]);
  const r2 = getPhotoRatio(photos[1]);
  const r3 = getPhotoRatio(photos[2]);

  // Layout A: Hero Left, Stack Right
  const rStackRight = 1 / (1 / r2 + 1 / r3);
  const rA = r1 + rStackRight;

  // Layout B: Hero Top, Row Bottom
  const rRowBottom = r2 + r3;
  const rB = 1 / (1 / r1 + 1 / rRowBottom);

  const scoreA = Math.abs(rA - 1.25) + (rA < 0.85 ? 0.5 : 0);
  const scoreB = Math.abs(rB - 1.25) + (rB < 0.85 ? 0.5 : 0);
  const isHeroLeft = scoreA <= scoreB;
  const totalRatio = isHeroLeft ? rA : rB;
  const clampedRatio = Math.max(0.75, Math.min(2.0, totalRatio));

  return (
    <div
      className='w-full relative overflow-hidden bg-muted/20 border border-border/40 group-hover:border-foreground/30 rounded-xs transition-all duration-500 ease-out group-hover:-translate-y-0.5'
      style={{ aspectRatio: `${clampedRatio}` }}
    >
      {isHeroLeft ? (
        <div className='flex gap-1 w-full h-full p-0.5 bg-border/20'>
          {/* Hero Left */}
          <div
            className='relative h-full overflow-hidden bg-muted/15 rounded-[1px]'
            style={{ flex: `${r1} 1 0%` }}
          >
            <BlurImage
              src={keyToUrl(photos[0].url)}
              alt={photos[0].title || `${title} - 1`}
              fill
              blurhash={photos[0].blurData}
              aspectRatio={r1}
              priority={priority}
              sizes='(max-width: 768px) 60vw, (max-width: 1200px) 22vw, 240px'
              className='object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.025]'
            />
          </div>

          {/* Stack Right */}
          <div
            className='flex flex-col gap-1 h-full'
            style={{ flex: `${rStackRight} 1 0%` }}
          >
            <div
              className='relative w-full overflow-hidden bg-muted/15 rounded-[1px]'
              style={{ flex: `${1 / r2} 1 0%` }}
            >
              <BlurImage
                src={keyToUrl(photos[1].url)}
                alt={photos[1].title || `${title} - 2`}
                fill
                blurhash={photos[1].blurData}
                aspectRatio={r2}
                sizes='(max-width: 768px) 40vw, (max-width: 1200px) 14vw, 150px'
                className='object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.025]'
              />
            </div>
            <div
              className='relative w-full overflow-hidden bg-muted/15 rounded-[1px]'
              style={{ flex: `${1 / r3} 1 0%` }}
            >
              <BlurImage
                src={keyToUrl(photos[2].url)}
                alt={photos[2].title || `${title} - 3`}
                fill
                blurhash={photos[2].blurData}
                aspectRatio={r3}
                sizes='(max-width: 768px) 40vw, (max-width: 1200px) 14vw, 150px'
                className='object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.025]'
              />
            </div>
          </div>
        </div>
      ) : (
        <div className='flex flex-col gap-1 w-full h-full p-0.5 bg-border/20'>
          {/* Hero Top */}
          <div
            className='relative w-full overflow-hidden bg-muted/15 rounded-[1px]'
            style={{ flex: `${1 / r1} 1 0%` }}
          >
            <BlurImage
              src={keyToUrl(photos[0].url)}
              alt={photos[0].title || `${title} - 1`}
              fill
              blurhash={photos[0].blurData}
              aspectRatio={r1}
              priority={priority}
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px'
              className='object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.025]'
            />
          </div>

          {/* Row Bottom */}
          <div
            className='flex gap-1 w-full'
            style={{ flex: `${1 / rRowBottom} 1 0%` }}
          >
            <div
              className='relative h-full overflow-hidden bg-muted/15 rounded-[1px]'
              style={{ flex: `${r2} 1 0%` }}
            >
              <BlurImage
                src={keyToUrl(photos[1].url)}
                alt={photos[1].title || `${title} - 2`}
                fill
                blurhash={photos[1].blurData}
                aspectRatio={r2}
                sizes='(max-width: 768px) 50vw, (max-width: 1200px) 18vw, 190px'
                className='object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.025]'
              />
            </div>
            <div
              className='relative h-full overflow-hidden bg-muted/15 rounded-[1px]'
              style={{ flex: `${r3} 1 0%` }}
            >
              <BlurImage
                src={keyToUrl(photos[2].url)}
                alt={photos[2].title || `${title} - 3`}
                fill
                blurhash={photos[2].blurData}
                aspectRatio={r3}
                sizes='(max-width: 768px) 50vw, (max-width: 1200px) 18vw, 190px'
                className='object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.025]'
              />
            </div>
          </div>
        </div>
      )}

      <div className='absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur-md border border-border/50 text-[10px] font-mono tracking-[0.16em] text-muted-foreground group-hover:text-foreground transition-colors z-20 pointer-events-none tabular-nums'>
        {totalCount > 3
          ? `${String(totalCount).padStart(2, '0')} AUFNAHMEN`
          : '03 AUFNAHMEN'}
      </div>
    </div>
  );
};

export const ZinePreviewCard = ({ post, priority = false }: ZinePreviewCardProps) => {
  const allPhotos = useMemo(
    () => (post.postsToPhotos?.map((ptp) => ptp.photo).filter(Boolean) as PreviewPhoto[]) || [],
    [post.postsToPhotos],
  );

  const photoCount = allPhotos.length > 0 ? allPhotos.length : post.coverImage ? 1 : 0;

  const previewPhotos = useMemo(() => {
    if (allPhotos.length === 0) {
      if (post.coverImage) {
        return [
          {
            id: 'cover',
            url: post.coverImage,
            aspectRatio: 1.5,
            blurData: '',
            title: post.title,
          },
        ];
      }
      return [];
    }

    if (allPhotos.length <= 2) {
      return allPhotos;
    }

    // If 3 or more photos, prioritize cover index if specified
    const coverIdx =
      typeof post.coverIndex === 'number' &&
      post.coverIndex >= 0 &&
      post.coverIndex < allPhotos.length
        ? post.coverIndex
        : 0;

    const hero = allPhotos[coverIdx];
    const others = allPhotos.filter((_, idx) => idx !== coverIdx);
    return [hero, others[0], others[1]];
  }, [allPhotos, post.coverIndex, post.coverImage, post.title]);

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

  const isArticle = post.type?.toLowerCase() === 'article';
  const href = isArticle
    ? `/article/${post.slug}`
    : post.type?.toLowerCase() === 'photo'
      ? `/photo/${post.slug}`
      : `/album/${post.slug}`;

  return (
    <Link
      href={href}
      className='group flex flex-col justify-between h-full select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs'
    >
      <div className='flex flex-col'>
        {/* 1. PHOTOGRAPHIC MULTI-IMAGE COLLAGE PLATE */}
        <ZineCardCollage
          photos={previewPhotos}
          totalCount={photoCount}
          title={post.title}
          priority={priority}
        />

        {/* 2. EDITORIAL METADATA & HEADLINE */}
        <div className='pt-3.5 space-y-2 flex-1'>
          {/* Eyebrow: Date & Primary Tag */}
          <div className='flex items-center gap-1.5 text-[10px] sm:text-[10.5px] font-mono tracking-[0.18em] uppercase text-muted-foreground/75 font-medium'>
            <time dateTime={post.createdAt ? new Date(post.createdAt).toISOString() : undefined}>
              {formattedDate}
            </time>
            {post.tags && post.tags.length > 0 && (
              <>
                <span className='text-muted-foreground/30'>/</span>
                <span className='truncate text-foreground/80 font-medium'>{post.tags[0]}</span>
              </>
            )}
          </div>

          {/* Headline */}
          <h4 className='text-base sm:text-lg lg:text-[1.125rem] font-serif font-normal tracking-[-0.015em] text-foreground group-hover:text-foreground/85 transition-colors line-clamp-2 leading-[1.24]'>
            {post.title}
          </h4>

          {/* Excerpt / Field Note */}
          {cleanContent && (
            <p className='text-xs sm:text-[13px] font-serif italic text-muted-foreground/75 line-clamp-2 leading-[1.55] pt-0.5'>
              {cleanContent}
            </p>
          )}
        </div>
      </div>

      {/* 3. DISCOVER CUE */}
      <div className='pt-3 flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-muted-foreground/70 group-hover:text-foreground transition-colors mt-auto'>
        <span>{isArticle ? 'Artikel lesen' : 'Geschichte ansehen'}</span>
        <IconArrowUpRight className='size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-muted-foreground/80 group-hover:text-foreground' />
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
          <div className='w-full aspect-[4/3] bg-muted/30 rounded-xs animate-pulse border border-border/30 p-1 flex gap-1'>
            <div className='flex-[2_1_0%] bg-muted/50 rounded-xs' />
            <div className='flex-[1_1_0%] flex flex-col gap-1'>
              <div className='flex-1 bg-muted/50 rounded-xs' />
              <div className='flex-1 bg-muted/50 rounded-xs' />
            </div>
          </div>
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
      limit: maxPosts + 1, // Fetch one extra in case the current one is excluded
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
          <div className='flex items-center gap-2 mb-1.5'>
            <span className='size-1.5 rounded-full bg-primary/70 animate-pulse' />
            <p className='text-[10px] sm:text-[11px] font-mono tracking-[0.22em] uppercase text-muted-foreground/80 font-medium'>
              Aus dem Journal
            </p>
          </div>
          <h3 className='text-2xl sm:text-3xl lg:text-[2rem] font-serif font-normal tracking-[-0.02em] leading-[1.15] text-foreground'>
            Weitere Serien & Geschichten
          </h3>
        </div>

        <Link
          href='/'
          className='inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors group/link w-fit'
        >
          <span>Alle Einträge ansehen</span>
          <IconArrowRight className='size-3.5 transition-transform duration-300 group-hover/link:translate-x-1' />
        </Link>
      </div>

      {/* Responsive 3-Card Grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start'>
        {filteredPosts.map((post, i) => (
          <ZinePreviewCard key={post.id} post={post} priority={i === 0} />
        ))}
      </div>

      {/* Bottom Editorial Callout */}
      <div className='mt-12 md:mt-16 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left'>
        <p className='text-xs sm:text-[13px] font-serif italic text-muted-foreground/80 leading-relaxed'>
          Dokumentarische Streifzüge, Notizen und Serien aus dem Alltag.
        </p>
        <Button
          asChild
          variant='outline'
          className='rounded-full px-6 text-xs font-mono uppercase tracking-[0.16em] border-border/70 hover:bg-muted'
        >
          <Link href='/'>
            Zum vollständigen Zine
          </Link>
        </Button>
      </div>
    </section>
  );
};
