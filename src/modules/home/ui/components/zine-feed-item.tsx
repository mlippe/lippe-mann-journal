'use client';

import { type PostWithPhotos } from '@/db/schema';
import Link from 'next/link';
import BlurImage from '@/components/blur-image';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { SocialInteractions } from '@/modules/social/ui/components/social-interactions';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { IconArrowRight, IconHeartFilled } from '@tabler/icons-react';
import { useRef, useState, useMemo } from 'react';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useIdentity } from '@/hooks/use-identity';
import { type SocialInteractionsData } from '@/modules/social/types';
import { ScrollReveal } from '@/components/scroll-reveal';
import { calculateReadingTime } from '@/modules/articles/lib/reading-time';
import { cn, createPreview } from '@/lib/utils';

interface ZineFeedItemProps {
  post: PostWithPhotos;
  priority?: boolean;
}

// Deterministic seed based on string hash so layout is 100% stable across reloads / SSR
function getPostSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const ZineFeedItem = ({ post, priority = false }: ZineFeedItemProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { fingerprint, isLoaded } = useIdentity();
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef<number>(0);

  const isArticle = post.type === 'ARTICLE';
  const href = isArticle
    ? `/article/${post.slug}`
    : post.type === 'PHOTO'
      ? `/photo/${post.slug}`
      : `/album/${post.slug}`;

  const interactionParams = {
    postId: post.id,
    userFingerprint: fingerprint ?? undefined,
  };
  const queryOptions =
    trpc.social.getInteractions.queryOptions(interactionParams);

  const toggleLike = useMutation(
    trpc.social.toggleLike.mutationOptions({
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: queryOptions.queryKey });
        const previous = queryClient.getQueryData<SocialInteractionsData>(
          queryOptions.queryKey,
        );

        if (previous) {
          queryClient.setQueryData<SocialInteractionsData>(
            queryOptions.queryKey,
            {
              ...previous,
              likeCount: previous.hasLiked
                ? previous.likeCount - 1
                : previous.likeCount + 1,
              hasLiked: !previous.hasLiked,
            },
          );
        }
        return { previous };
      },
      onError: (err, newLike, context) => {
        if (context?.previous) {
          queryClient.setQueryData(queryOptions.queryKey, context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
      },
    }),
  );

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      e.preventDefault();
      const interactions = queryClient.getQueryData<SocialInteractionsData>(
        queryOptions.queryKey,
      );
      if (fingerprint && isLoaded && !interactions?.hasLiked) {
        toggleLike.mutate({ postId: post.id, userFingerprint: fingerprint });
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTap.current = now;
  };

  const photos = post.postsToPhotos || [];
  const highlightEntry = photos.find((p) => p.isHighlight);
  const coverIndex = post.coverIndex ?? 0;
  const coverPhoto = highlightEntry?.photo || photos[coverIndex]?.photo || photos[0]?.photo;
  const hasMultiplePhotos = photos.length > 1;

  const firstPhoto = photos[0]?.photo;
  const firstPhotoRatio =
    firstPhoto?.aspectRatio ||
    (firstPhoto?.width && firstPhoto?.height
      ? firstPhoto.width / firstPhoto.height
      : 1.5);
  const isLandscapeFirstPhoto = firstPhotoRatio >= 1.15;

  const coverRatio =
    coverPhoto?.aspectRatio ||
    (coverPhoto?.width && coverPhoto?.height
      ? coverPhoto.width / coverPhoto.height
      : 1.5);
  const isLandscapeCover = coverRatio >= 1.15;

  const formattedDate = post.createdAt
    ? format(new Date(post.createdAt), 'dd. MMMM yyyy', { locale: de })
    : '';

  const coverImageUrl = post.coverImage
    ? keyToUrl(post.coverImage)
    : coverPhoto?.url
      ? keyToUrl(coverPhoto.url)
      : null;
  const hasImage = Boolean(coverImageUrl);

  const readingTime = useMemo(() => {
    if (!isArticle) return 0;
    return Math.max(1, calculateReadingTime(post.content));
  }, [isArticle, post.content]);

  // Clean lead text / excerpt for editorial header
  const leadText = useMemo(() => {
    if (isArticle) {
      if (!post.content) return null;
      const withoutHeadings = post.content.replace(
        /<h[1-3][^>]*>.*?<\/h[1-3]>/gi,
        ' ',
      );
      const source =
        withoutHeadings.trim().length > 40 ? withoutHeadings : post.content;
      return createPreview(source, hasImage ? 260 : 380);
    }
    if (!post.content) return null;
    const firstLine = post.content.trim().split(/\r?\n/)[0].trim();
    return firstLine || null;
  }, [isArticle, post.content, hasImage]);

  // Stable seed for layout variety
  const seed = useMemo(
    () => getPostSeed(post.id || post.slug),
    [post.id, post.slug],
  );

  // Creative Desktop Layout Variations:
  // - 'solo': single photo or article
  // - 'bold-diptych': 2 large photos side-by-side filling the container
  // - 'hero-companion-stack': 1 large anchor left (~60%) + 2 stacked companions right (~40%)
  // - 'hero-diptych-spread': 1 dominant anchor top + 2 large photos below
  const desktopLayout = useMemo(() => {
    if (isArticle || !hasMultiplePhotos || photos.length === 1) return 'solo';
    if (photos.length === 2) return 'bold-diptych';

    const mod = seed % 3;
    if (mod === 0) return 'hero-companion-stack';
    if (mod === 1) return 'bold-diptych';
    return 'hero-diptych-spread';
  }, [isArticle, hasMultiplePhotos, photos.length, seed]);

  // Mobile layout style:
  // - 'sticky-deck': 2 photos stacked like a tactile card deck (Photo 1 pins, Photo 2 glides up)
  // - 'mobile-diptych': 2 photos side by side with smooth ScrollReveal
  // - 'single': large full-width hero with smooth ScrollReveal
  const mobileLayout = useMemo(() => {
    if (isArticle || !hasMultiplePhotos || photos.length < 2) return 'single';
    // Mix sticky card deck (~65%) randomly with scroll reveals (diptych / single)
    const mod = seed % 3;
    if (mod !== 0) return 'sticky-deck';
    return seed % 2 === 0 ? 'mobile-diptych' : 'single';
  }, [isArticle, hasMultiplePhotos, photos.length, seed]);

  return (
    <article
      className='w-full py-12 sm:py-16 md:py-24 border-b border-border/40 last:border-b-0'
      style={
        !priority
          ? {
              contentVisibility: 'auto',
              containIntrinsicSize: hasImage
                ? 'auto none auto 800px'
                : 'auto none auto 280px',
            }
          : undefined
      }
    >
      {/* Editorial Header */}
      <header className='mb-6 sm:mb-8 md:mb-10 space-y-2 sm:space-y-3 max-w-3xl'>
        <div className='flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs uppercase font-mono tracking-[0.12em] sm:tracking-[0.14em] font-medium tabular-nums text-muted-foreground'>
          <span className={isArticle ? 'text-foreground font-semibold' : ''}>
            {isArticle
              ? 'Artikel'
              : hasMultiplePhotos
                ? `Serie (${photos.length} Fotos)`
                : 'Einzelaufnahme'}
          </span>
          {isArticle && (
            <>
              <span className='text-muted-foreground/40'>·</span>
              <span>{readingTime} Min Lesezeit</span>
            </>
          )}
          <span className='text-muted-foreground/40'>·</span>
          <span>{formattedDate}</span>
        </div>

        <h2 className='text-[1.75rem] sm:text-3xl md:text-4xl lg:text-[2.65rem] font-medium tracking-tight md:tracking-[-0.03em] text-foreground leading-[1.12] sm:leading-[1.1] md:leading-[1.08]'>
          <Link href={href} className='hover:opacity-75 transition-opacity'>
            {post.title}
          </Link>
        </h2>

        {/* Field Note / Journal Text / Article Excerpt */}
        {leadText && (
          <p className='pt-1 sm:pt-1.5 text-base sm:text-[17px] md:text-lg font-normal text-foreground/85 leading-[1.6] md:leading-[1.65] max-w-2xl'>
            {leadText}
          </p>
        )}
      </header>

      {/* Main Photographic Presentation */}
      {hasImage && (
        <div className='relative w-full' onClick={handleDoubleTap}>
        {/* Double Tap Heart Feedback */}
        {showHeart && (
          <div className='absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in zoom-in-50 fade-in duration-300'>
            <IconHeartFilled className='size-24 text-white/90 drop-shadow-2xl' />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
         * DESKTOP VIEW: Artsy, Large-Scale Visual Anchors
         * ───────────────────────────────────────────────────────────── */}
        <div className='hidden md:block w-full'>
          {/* VARIANT 1: BOLD DIPTYCH (2 large photos side-by-side with ScrollReveal) */}
          {desktopLayout === 'bold-diptych' && (
            <ScrollReveal disabled={priority} className='w-full'>
              <div className='flex gap-4 lg:gap-6 w-full items-stretch'>
                {photos.slice(0, 2).map((ptp, i) => {
                  const ratio =
                    ptp.photo.aspectRatio ||
                    (ptp.photo.width && ptp.photo.height
                      ? ptp.photo.width / ptp.photo.height
                      : 0.67);
                  return (
                    <Link
                      key={ptp.photo.id}
                      href={href}
                      className='relative block group overflow-hidden rounded-xs transition-transform duration-500 ease-out hover:-translate-y-0.5 cursor-ansehen'
                      style={{ flex: `${ratio} 1 0%` }}
                    >
                      <div
                        style={{ aspectRatio: `${ratio}` }}
                        className='relative w-full'
                      >
                        <BlurImage
                          src={keyToUrl(ptp.photo.url)}
                          alt={ptp.photo.title ?? `${post.title} - ${i + 1}`}
                          fill
                          priority={priority && i === 0}
                          blurhash={ptp.photo.blurData}
                          aspectRatio={ratio}
                          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px'
                          className='object-contain'
                        />
                        {i === 1 && photos.length > 2 && (
                          <div className='absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur-md border border-border/50 text-[11px] font-mono tracking-[0.12em] font-medium text-foreground/90 tabular-nums z-10 pointer-events-none'>
                            +{photos.length - 2}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </ScrollReveal>
          )}

          {/* VARIANT 2: HERO + COMPANION STACK (1 dominant anchor left ~60% sticky, 2 companions right ~40%) */}
          {desktopLayout === 'hero-companion-stack' && photos.length >= 3 && (
            <div className='flex gap-4 lg:gap-6 w-full items-start'>
              {/* Left Dominant Anchor (Sticky while companions scroll) */}
              {(() => {
                const p1 = photos[0].photo;
                const r1 =
                  p1.aspectRatio ||
                  (p1.width && p1.height ? p1.width / p1.height : 0.67);
                return (
                  <div
                    className='sticky top-6 pb-[7.5vh] md:pb-[5vh] self-start'
                    style={{ flex: `${r1 * 1.8} 1 0%` }}
                  >
                    <Link
                      href={href}
                      className='relative block group overflow-hidden rounded-xs transition-transform duration-500 ease-out hover:-translate-y-0.5 cursor-ansehen'
                    >
                      <div
                        style={{ aspectRatio: `${r1}` }}
                        className='relative w-full h-full'
                      >
                        <BlurImage
                          src={keyToUrl(p1.url)}
                          alt={p1.title ?? post.title}
                          fill
                          priority={priority}
                          blurhash={p1.blurData}
                          aspectRatio={r1}
                          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 65vw, 750px'
                          className='object-contain'
                        />
                      </div>
                    </Link>
                  </div>
                );
              })()}

              {/* Right Stacked Companions */}
              <div className='flex flex-col gap-4 lg:gap-6 flex-1 justify-between'>
                {photos.slice(1, 3).map((ptp, i) => {
                  const ratio =
                    ptp.photo.aspectRatio ||
                    (ptp.photo.width && ptp.photo.height
                      ? ptp.photo.width / ptp.photo.height
                      : 0.67);
                  return (
                    <Link
                      key={ptp.photo.id}
                      href={href}
                      className='relative block group overflow-hidden flex-1 rounded-xs transition-transform duration-500 ease-out hover:-translate-y-0.5 cursor-ansehen'
                    >
                      <div
                        style={{ aspectRatio: `${ratio}` }}
                        className='relative w-full h-full'
                      >
                        <BlurImage
                          src={keyToUrl(ptp.photo.url)}
                          alt={ptp.photo.title ?? `${post.title} - ${i + 2}`}
                          fill
                          blurhash={ptp.photo.blurData}
                          aspectRatio={ratio}
                          sizes='(max-width: 768px) 50vw, (max-width: 1200px) 35vw, 420px'
                          className='object-contain'
                        />
                        {i === 1 && photos.length > 3 && (
                          <div className='absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur-md border border-border/50 text-[11px] font-mono tracking-[0.12em] font-medium text-foreground/90 tabular-nums z-10 pointer-events-none'>
                            +{photos.length - 3}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* VARIANT 3: HERO + DIPTYCH SPREAD (1 prominent anchor top + 2 photos below, mixed sticky / reveal) */}
          {desktopLayout === 'hero-diptych-spread' &&
            (seed % 2 === 0 ? (
              /* Desktop Sticky Glide: Hero pins briefly, diptych smoothly glides over */
              <div className='relative w-full pb-4'>
                <div className='sticky top-6 pb-[7.5vh] md:pb-[5vh] z-0 w-full flex justify-center'>
                  <Link
                    href={href}
                    className='block relative group overflow-hidden max-h-[94vh] rounded-xs transition-transform duration-500 ease-out hover:-translate-y-0.5 cursor-ansehen mx-auto'
                    style={{
                      aspectRatio: `${firstPhotoRatio}`,
                      width: isLandscapeFirstPhoto
                        ? '100%'
                        : `min(100%, calc(94vh * ${firstPhotoRatio}))`,
                    }}
                  >
                    <BlurImage
                      src={keyToUrl(firstPhoto?.url)}
                      alt={firstPhoto?.title ?? post.title}
                      fill
                      priority={priority}
                      blurhash={firstPhoto?.blurData}
                      aspectRatio={firstPhotoRatio}
                      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px'
                      className='object-contain'
                    />
                  </Link>
                </div>

                <div className='relative z-10 bg-background pt-6 pb-2 -mx-2 px-2 flex gap-4 lg:gap-6 w-full items-stretch shadow-[0_-16px_32px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_-16px_32px_-12px_rgba(0,0,0,0.4)] mt-4 md:mt-6 rounded-xs'>
                  {photos.slice(1, 3).map((ptp, i) => {
                    const ratio =
                      ptp.photo.aspectRatio ||
                      (ptp.photo.width && ptp.photo.height
                        ? ptp.photo.width / ptp.photo.height
                        : 0.67);
                    return (
                      <Link
                        key={ptp.photo.id}
                        href={href}
                        className='relative block group overflow-hidden rounded-xs transition-transform duration-500 ease-out hover:-translate-y-0.5 cursor-ansehen'
                        style={{ flex: `${ratio} 1 0%` }}
                      >
                        <div
                          style={{ aspectRatio: `${ratio}` }}
                          className='relative w-full'
                        >
                          <BlurImage
                            src={keyToUrl(ptp.photo.url)}
                            alt={ptp.photo.title ?? `${post.title} - ${i + 2}`}
                            fill
                            blurhash={ptp.photo.blurData}
                            aspectRatio={ratio}
                            sizes='(max-width: 768px) 50vw, (max-width: 1200px) 45vw, 576px'
                            className='object-contain'
                          />
                          {i === 1 && photos.length > 3 && (
                            <div className='absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur-md border border-border/50 text-[11px] font-mono tracking-[0.12em] font-medium text-foreground/90 tabular-nums z-10 pointer-events-none'>
                              +{photos.length - 3}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Desktop Scroll Reveal Spread */
              <ScrollReveal disabled={priority} className='space-y-4 lg:space-y-6 w-full'>
                <div className='w-full flex justify-center'>
                  <Link
                    href={href}
                    className='block relative group overflow-hidden max-h-[94vh] rounded-xs transition-transform duration-500 ease-out hover:-translate-y-0.5 cursor-ansehen mx-auto'
                    style={{
                      aspectRatio: `${firstPhotoRatio}`,
                      width: isLandscapeFirstPhoto
                        ? '100%'
                        : `min(100%, calc(94vh * ${firstPhotoRatio}))`,
                    }}
                  >
                    <BlurImage
                      src={keyToUrl(firstPhoto?.url)}
                      alt={firstPhoto?.title ?? post.title}
                      fill
                      priority={priority}
                      blurhash={firstPhoto?.blurData}
                      aspectRatio={firstPhotoRatio}
                      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px'
                      className='object-contain'
                    />
                  </Link>
                </div>

                <div className='flex gap-4 lg:gap-6 w-full items-stretch'>
                  {photos.slice(1, 3).map((ptp, i) => {
                    const ratio =
                      ptp.photo.aspectRatio ||
                      (ptp.photo.width && ptp.photo.height
                        ? ptp.photo.width / ptp.photo.height
                        : 0.67);
                    return (
                      <Link
                        key={ptp.photo.id}
                        href={href}
                        className='relative block group overflow-hidden rounded-xs transition-transform duration-500 ease-out hover:-translate-y-0.5 cursor-ansehen'
                        style={{ flex: `${ratio} 1 0%` }}
                      >
                        <div
                          style={{ aspectRatio: `${ratio}` }}
                          className='relative w-full'
                        >
                          <BlurImage
                            src={keyToUrl(ptp.photo.url)}
                            alt={ptp.photo.title ?? `${post.title} - ${i + 2}`}
                            fill
                            blurhash={ptp.photo.blurData}
                            aspectRatio={ratio}
                            sizes='(max-width: 768px) 50vw, (max-width: 1200px) 45vw, 576px'
                            className='object-contain'
                          />
                          {i === 1 && photos.length > 3 && (
                            <div className='absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur-md border border-border/50 text-[11px] font-mono tracking-[0.12em] font-medium text-foreground/90 tabular-nums z-10 pointer-events-none'>
                              +{photos.length - 3}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </ScrollReveal>
            ))}

          {/* VARIANT 4: SINGLE LARGE SOLO HERO WITH SCROLL REVEAL */}
          {desktopLayout === 'solo' && (
            <ScrollReveal disabled={priority} className='w-full'>
              <div className='w-full flex justify-center'>
                <Link
                  href={href}
                  className='block relative group overflow-hidden max-h-[94vh] rounded-xs transition-transform duration-500 ease-out hover:-translate-y-0.5 cursor-ansehen mx-auto'
                  style={{
                    aspectRatio: `${coverRatio}`,
                    width:
                      !isArticle && !isLandscapeCover
                        ? `min(100%, calc(94vh * ${coverRatio}))`
                        : '100%',
                  }}
                >
                  <BlurImage
                    src={coverImageUrl!}
                    alt={coverPhoto?.title ?? post.title}
                    fill
                    priority={priority}
                    blurhash={coverPhoto?.blurData}
                    aspectRatio={coverRatio}
                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px'
                    className={isArticle ? 'object-cover' : 'object-contain'}
                  />
                </Link>
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
         * MOBILE VIEW: Mixed Stacking Deck & Scroll Reveal
         * ───────────────────────────────────────────────────────────── */}
        <div className='block md:hidden w-full'>
          {mobileLayout === 'sticky-deck' && photos.length >= 2 ? (
            /* Mobile Sticky Stacking Deck: Photo 1 pins, Photo 2 glides over it! */
            <div className='relative w-full pb-4'>
              {/* Photo 1 (Sticky Pin) */}
              <div className='sticky top-16 md:top-6 pb-[7.5vh] md:pb-[5vh] z-0'>
                <Link
                  href={href}
                  className='block relative w-full overflow-hidden rounded-xs group bg-muted/20 cursor-ansehen'
                  style={{
                    aspectRatio: photos[0].photo.aspectRatio
                      ? `${photos[0].photo.aspectRatio}`
                      : '3 / 2',
                  }}
                >
                  <BlurImage
                    src={keyToUrl(photos[0].photo.url)}
                    alt={photos[0].photo.title ?? post.title}
                    fill
                    priority={priority}
                    blurhash={photos[0].photo.blurData}
                    aspectRatio={photos[0].photo.aspectRatio}
                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 65vw, 750px'
                    className='object-contain'
                  />
                  <div className='absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 text-[11px] font-mono tracking-[0.12em] font-medium tabular-nums text-foreground/90 select-none'>
                    01
                  </div>
                </Link>
              </div>

              {/* Photo 2 (Glides up and overlays Photo 1) */}
              <div className='relative z-10 bg-background mt-4 pt-3 pb-1 -mx-1 px-1 shadow-[0_-14px_28px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_-14px_28px_-10px_rgba(0,0,0,0.45)]'>
                <Link
                  href={href}
                  className='block relative w-full overflow-hidden rounded-xs group cursor-ansehen'
                  style={{
                    aspectRatio: photos[1].photo.aspectRatio
                      ? `${photos[1].photo.aspectRatio}`
                      : '3 / 2',
                  }}
                >
                  <BlurImage
                    src={keyToUrl(photos[1].photo.url)}
                    alt={photos[1].photo.title ?? `${post.title} - 2`}
                    fill
                    blurhash={photos[1].photo.blurData}
                    aspectRatio={photos[1].photo.aspectRatio}
                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 65vw, 750px'
                    className='object-contain'
                  />
                  <div className='absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 text-[11px] font-mono tracking-[0.12em] font-medium tabular-nums text-foreground/90 select-none'>
                    02
                  </div>
                </Link>
              </div>
            </div>
          ) : mobileLayout === 'mobile-diptych' ? (
            /* Mobile Diptych with Scroll Reveal */
            <ScrollReveal disabled={priority} className='w-full'>
              <div className='flex gap-3 sm:gap-4 w-full items-stretch'>
                {photos.slice(0, 2).map((ptp, i) => {
                  const ratio =
                    ptp.photo.aspectRatio ||
                    (ptp.photo.width && ptp.photo.height
                      ? ptp.photo.width / ptp.photo.height
                      : 0.67);
                  return (
                    <Link
                      key={ptp.photo.id}
                      href={href}
                      className='relative block group overflow-hidden bg-muted/20 rounded-xs cursor-ansehen'
                      style={{ flex: `${ratio} 1 0%` }}
                    >
                      <div
                        style={{ aspectRatio: `${ratio}` }}
                        className='relative w-full'
                      >
                        <BlurImage
                          src={keyToUrl(ptp.photo.url)}
                          alt={ptp.photo.title ?? `${post.title} - ${i + 1}`}
                          fill
                          priority={priority && i === 0}
                          blurhash={ptp.photo.blurData}
                          aspectRatio={ratio}
                          sizes='(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 600px'
                          className='object-contain'
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </ScrollReveal>
          ) : (
            /* Mobile Single Hero with Scroll Reveal */
            <ScrollReveal disabled={priority} className='w-full'>
              <Link
                href={href}
                className='block relative w-full overflow-hidden rounded-xs cursor-ansehen'
                style={{
                  aspectRatio: coverPhoto?.aspectRatio
                    ? `${coverPhoto.aspectRatio}`
                    : '3 / 2',
                }}
              >
                <BlurImage
                  src={coverImageUrl!}
                  alt={coverPhoto?.title ?? post.title}
                  fill
                  priority={priority}
                  blurhash={coverPhoto?.blurData}
                  aspectRatio={coverPhoto?.aspectRatio || 1.5}
                  sizes='(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1152px'
                  className={isArticle ? 'object-cover' : 'object-contain'}
                />
              </Link>
            </ScrollReveal>
          )}
        </div>
      </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
       * Editorial Footer: ONE Clear & Concise CTA
       * ───────────────────────────────────────────────────────────── */}
      <footer className='mt-6 sm:mt-8 pt-4 sm:pt-5 flex items-center justify-between border-t border-border/30'>
        <div className='flex items-center gap-4'>
          <SocialInteractions
            postId={post.id}
            variant='compact'
            commentHref={href}
          />
        </div>

        <Link
          href={href}
          className='text-xs sm:text-[13px] uppercase font-mono tracking-[0.12em] sm:tracking-[0.14em] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors group'
        >
          <span>
            {isArticle
              ? 'Artikel lesen'
              : hasMultiplePhotos
                ? `Serie öffnen (${photos.length} Fotos)`
                : 'Aufnahme ansehen'}
          </span>
          <IconArrowRight className='size-3.5 group-hover:translate-x-0.5 transition-transform' />
        </Link>
      </footer>
    </article>
  );
};


