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
  const coverIndex = post.coverIndex ?? 0;
  const coverPhoto = photos[coverIndex]?.photo || photos[0]?.photo;
  const hasMultiplePhotos = photos.length > 1;

  const formattedDate = post.createdAt
    ? format(new Date(post.createdAt), 'dd. MMMM yyyy', { locale: de })
    : '';

  const cleanContent = post.content ? createPreview(post.content, 350) : null;

  // Stable seed for layout variety
  const seed = useMemo(
    () => getPostSeed(post.id || post.slug),
    [post.id, post.slug],
  );

  // Creative Desktop Layout Variations:
  // - 'solo': single photo
  // - 'bold-diptych': 2 large photos side-by-side filling the container
  // - 'hero-companion-stack': 1 large anchor left (~60%) + 2 stacked companions right (~40%)
  // - 'hero-diptych-spread': 1 dominant anchor top + 2 large photos below
  const desktopLayout = useMemo(() => {
    if (!hasMultiplePhotos || photos.length === 1) return 'solo';
    if (photos.length === 2) return 'bold-diptych';

    const mod = seed % 3;
    if (mod === 0) return 'hero-companion-stack';
    if (mod === 1) return 'bold-diptych';
    return 'hero-diptych-spread';
  }, [hasMultiplePhotos, photos.length, seed]);

  // Mobile layout style:
  // - 'mobile-diptych': 2 photos side by side on mobile (~35% of multi-photo sets)
  // - 'single': large full-width hero
  const mobileLayout = useMemo(() => {
    if (!hasMultiplePhotos || photos.length < 2) return 'single';
    return seed % 5 < 2 ? 'mobile-diptych' : 'single';
  }, [hasMultiplePhotos, photos.length, seed]);

  return (
    <article className='w-full py-10 md:py-18 border-b border-border/40 last:border-b-0'>
      {/* Editorial Header */}
      <header className='mb-6 md:mb-8 space-y-2 max-w-3xl'>
        <div className='flex items-center gap-2 text-[11px] uppercase font-mono tracking-widest text-muted-foreground'>
          <span>
            {isArticle
              ? 'Artikel'
              : hasMultiplePhotos
                ? `Serie (${photos.length} Fotos)`
                : 'Einzelaufnahme'}
          </span>
          <span>·</span>
          <span>{formattedDate}</span>
        </div>

        <h2 className='text-2xl sm:text-3xl md:text-4xl font-serif tracking-tight text-foreground'>
          <Link href={href} className='hover:opacity-80 transition-opacity'>
            {post.title}
          </Link>
        </h2>

        {/* Field Note / Journal Text */}
        {cleanContent && (
          <p className='pt-2 text-base md:text-lg font-serif italic text-foreground/80 leading-relaxed max-w-2xl'>
            {cleanContent}
          </p>
        )}
      </header>

      {/* Main Photographic Presentation - Zero-Crop Guarantee */}
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
          {/* VARIANT 1: BOLD DIPTYCH (2 large photos side-by-side, commanding real estate) */}
          {desktopLayout === 'bold-diptych' && (
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
                    className='relative block group overflow-hidden bg-muted/20'
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
                        sizes='(max-width: 1400px) 50vw, 650px'
                        className='object-contain group-hover:scale-[1.01] transition-transform duration-500'
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* VARIANT 2: HERO + COMPANION STACK (1 dominant left ~60%, 2 stacked companions right ~40%) */}
          {desktopLayout === 'hero-companion-stack' && photos.length >= 3 && (
            <div className='flex gap-4 lg:gap-6 w-full items-stretch'>
              {/* Left Dominant Anchor */}
              {(() => {
                const p1 = photos[0].photo;
                const r1 =
                  p1.aspectRatio ||
                  (p1.width && p1.height ? p1.width / p1.height : 0.67);
                return (
                  <Link
                    href={href}
                    className='relative block group overflow-hidden bg-muted/20'
                    style={{ flex: `${r1 * 1.8} 1 0%` }}
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
                        sizes='(max-width: 1400px) 65vw, 800px'
                        className='object-contain group-hover:scale-[1.01] transition-transform duration-500'
                      />
                    </div>
                  </Link>
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
                      className='relative block group overflow-hidden bg-muted/20 flex-1'
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
                          sizes='(max-width: 1400px) 35vw, 450px'
                          className='object-contain group-hover:scale-[1.01] transition-transform duration-500'
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* VARIANT 3: HERO + DIPTYCH SPREAD (1 big anchor top + 2 large photos below) */}
          {desktopLayout === 'hero-diptych-spread' && (
            <div className='space-y-4 lg:space-y-6 w-full'>
              {/* Lead Hero Frame */}
              <Link
                href={href}
                className='block relative group overflow-hidden max-h-[80vh]'
                style={{
                  aspectRatio: coverPhoto?.aspectRatio
                    ? `${coverPhoto.aspectRatio}`
                    : '3 / 2',
                }}
              >
                <BlurImage
                  src={keyToUrl(coverPhoto?.url)}
                  alt={coverPhoto?.title ?? post.title}
                  fill
                  priority={priority}
                  blurhash={coverPhoto?.blurData}
                  aspectRatio={coverPhoto?.aspectRatio}
                  sizes='(max-width: 1400px) 100vw, 1200px'
                  className='object-contain bg-muted/20 group-hover:scale-[1.005] transition-transform duration-500'
                />
              </Link>

              {/* Secondary Diptych Pair */}
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
                      className='relative block group overflow-hidden bg-muted/20'
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
                          sizes='(max-width: 1400px) 50vw, 600px'
                          className='object-contain bg-muted/20 group-hover:scale-[1.01] transition-transform duration-500'
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* VARIANT 4: SINGLE LARGE SOLO HERO */}
          {desktopLayout === 'solo' && (
            <Link
              href={href}
              className='block relative group overflow-hidden max-h-[85vh] w-full'
              style={{
                aspectRatio: coverPhoto?.aspectRatio
                  ? `${coverPhoto.aspectRatio}`
                  : '3 / 2',
              }}
            >
              <BlurImage
                src={keyToUrl(coverPhoto?.url || post.coverImage)}
                alt={coverPhoto?.title ?? post.title}
                fill
                priority={priority}
                blurhash={coverPhoto?.blurData}
                aspectRatio={coverPhoto?.aspectRatio}
                sizes='(max-width: 1400px) 100vw, 1200px'
                className='object-contain bg-muted/20 group-hover:scale-[1.005] transition-transform duration-500'
              />
            </Link>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
         * MOBILE VIEW: Large Immersive Frames with Occasional Pair
         * ───────────────────────────────────────────────────────────── */}
        <div className='block md:hidden w-full'>
          {mobileLayout === 'mobile-diptych' ? (
            /* Mobile Diptych: 2 photos side by side with good presence */
            <div className='flex gap-2.5 w-full items-stretch'>
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
                    className='relative block group overflow-hidden bg-muted/20'
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
                        sizes='50vw'
                        className='object-contain'
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Mobile Full-Width Visual Anchor */
            <Link
              href={href}
              className='block relative w-full overflow-hidden'
              style={{
                aspectRatio: coverPhoto?.aspectRatio
                  ? `${coverPhoto.aspectRatio}`
                  : '3 / 2',
              }}
            >
              <BlurImage
                src={keyToUrl(coverPhoto?.url || post.coverImage)}
                alt={coverPhoto?.title ?? post.title}
                fill
                priority={priority}
                blurhash={coverPhoto?.blurData}
                aspectRatio={coverPhoto?.aspectRatio}
                sizes='100vw'
                className='object-contain'
              />
            </Link>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
       * Editorial Footer: ONE Clear & Concise CTA
       * ───────────────────────────────────────────────────────────── */}
      <footer className='mt-6 pt-4 flex items-center justify-between border-t border-border/30'>
        <div className='flex items-center gap-4'>
          <SocialInteractions
            postId={post.id}
            variant='compact'
            commentHref={href}
          />
        </div>

        <Link
          href={href}
          className='text-xs uppercase font-mono tracking-wider text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors group'
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
