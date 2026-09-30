'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  IconArrowLeft,
  IconArrowsMaximize,
  IconCamera,
  IconClock,
  IconShare,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconMessageCircle,
  IconHeart,
  IconHeartFilled,
  IconMail,
  IconZoomIn,
  IconZoomOut,
} from '@tabler/icons-react';
import { toast } from 'sonner';

import { PostGetOne } from '@/modules/posts/types';
import { Photo } from '@/db/schema';
import BlurImage from '@/components/blur-image';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { SocialInteractions } from '@/modules/social/ui/components/social-interactions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Author from '@/components/author';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useIdentity } from '@/hooks/use-identity';
import { type SocialInteractionsData } from '@/modules/social/types';

interface EditorialStoryViewProps {
  post: PostGetOne;
}

type EditorialBlock =
  | { type: 'hero'; photo: Photo; index: number }
  | { type: 'diptych'; photos: [Photo, Photo]; startIndex: number }
  | { type: 'contact-strip'; photos: Photo[]; startIndex: number }
  | { type: 'solo'; photo: Photo; index: number };

export const EditorialStoryView = ({ post }: EditorialStoryViewProps) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { fingerprint, isLoaded } = useIdentity();

  const [copied, setCopied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  // Touch swipe tracking refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Social query & mutation setup
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

  // Extract all photos sorted
  const photos: Photo[] = useMemo(() => {
    if (post.postsToPhotos && post.postsToPhotos.length > 0) {
      return post.postsToPhotos.map((ptp) => ptp.photo);
    }
    if (post.coverImage) {
      return [
        {
          id: post.id,
          url: post.coverImage,
          title: post.title,
          aspectRatio: 1.5,
          width: 1200,
          height: 800,
          blurData: '',
          make: null,
          model: null,
          lensModel: null,
          focalLength: null,
          focalLength35mm: null,
          fNumber: null,
          iso: null,
          exposureTime: null,
          exposureCompensation: null,
          latitude: null,
          longitude: null,
          gpsAltitude: null,
          dateTimeOriginal: post.createdAt,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
      ];
    }
    return [];
  }, [post]);

  // Anti-template dynamic layout pacing
  const blocks: EditorialBlock[] = useMemo(() => {
    if (photos.length === 0) return [];
    if (photos.length === 1) {
      return [{ type: 'hero', photo: photos[0], index: 0 }];
    }

    const hero = photos[0];
    const remaining = photos.slice(1);
    const result: EditorialBlock[] = [
      { type: 'hero', photo: hero, index: 0 },
    ];

    let i = 0;
    while (i < remaining.length) {
      const left = remaining.length - i;

      // When 4 or more photos remain, insert a contact strip
      if (left >= 4 && (i % 4 === 1 || left === 4)) {
        const stripCount = left >= 4 && left !== 5 ? 4 : 3;
        result.push({
          type: 'contact-strip',
          photos: remaining.slice(i, i + stripCount),
          startIndex: i + 1,
        });
        i += stripCount;
      } else if (left >= 2 && left !== 3) {
        // Diptych pair in visual dialogue
        result.push({
          type: 'diptych',
          photos: [remaining[i], remaining[i + 1]],
          startIndex: i + 1,
        });
        i += 2;
      } else {
        // Solo feature frame
        result.push({
          type: 'solo',
          photo: remaining[i],
          index: i + 1,
        });
        i += 1;
      }
    }

    return result;
  }, [photos]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link in Zwischenablage kopiert');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const createPrintInquiryUrl = (photo: Photo) => {
    const photoTitle = photo.title || 'Aufnahme';
    const subject = encodeURIComponent(
      `Print-Anfrage: ${photoTitle} (aus „${post.title}“)`,
    );
    const body = encodeURIComponent(
      `Hallo Manuel,\n\nich interessiere mich für einen Fine-Art Print von dieser Aufnahme:\n\n• Serie: ${post.title}\n• Foto: ${photoTitle}\n• Bild-Link: ${keyToUrl(photo.url)}\n\nBitte gib mir unverbindlich Bescheid über verfügbare Formate, Papiersorten und Konditionen.\n\nViele Grüße`,
    );
    return `mailto:manuel@lippe-mann.de?subject=${subject}&body=${body}`;
  };

  // Cycling photos in lightbox
  const handleNextPhoto = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % photos.length : null,
    );
    setIsZoomed(false);
  }, [photos.length]);

  const handlePrevPhoto = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + photos.length) % photos.length : null,
    );
    setIsZoomed(false);
  }, [photos.length]);

  // Reset zoom on slide change
  useEffect(() => {
    setIsZoomed(false);
  }, [lightboxIndex]);

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') {
        handleNextPhoto();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
        setIsZoomed(false);
      }
    },
    [lightboxIndex, handleNextPhoto, handlePrevPhoto],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch swipe support in lightbox
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isZoomed || touchStartX.current === null || touchStartY.current === null)
      return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Minimum swipe distance 40px and predominantly horizontal
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNextPhoto();
      } else {
        handlePrevPhoto();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Click/Tap to zoom in lightbox
  const handleImageZoomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomOrigin({ x, y });
      setIsZoomed(true);
    } else {
      setIsZoomed(false);
    }
  };

  const formattedDate = useMemo(() => {
    if (!post.createdAt) return '';
    return format(new Date(post.createdAt), 'dd. MMMM yyyy', { locale: de });
  }, [post.createdAt]);

  const collections =
    post.postsToCollections?.map((ptc) => ptc.collection) || [];
  const currentInteractions = queryClient.getQueryData<SocialInteractionsData>(
    queryOptions.queryKey,
  );

  return (
    <article className='w-full max-w-6xl mx-auto px-3 sm:px-6 md:px-8 py-6 md:py-12'>
      {/* 1. TOP BREADCRUMB & UTILITY HEADER */}
      <header className='mb-8 md:mb-14'>
        <div className='flex items-center justify-between gap-4 mb-6 border-b border-border/40 pb-4'>
          <button
            onClick={() => router.back()}
            className='inline-flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
          >
            <IconArrowLeft className='size-3.5' />
            <span>Zurück</span>
          </button>

          <div className='flex items-center gap-3'>
            <button
              onClick={handleShare}
              className='inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
            >
              {copied ? (
                <>
                  <IconCheck className='size-3.5 text-emerald-500' />
                  <span className='text-emerald-500'>Kopiert</span>
                </>
              ) : (
                <>
                  <IconShare className='size-3.5' />
                  <span>Teilen</span>
                </>
              )}
            </button>
            <a
              href='#guestbook'
              className='inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors'
            >
              <IconMessageCircle className='size-3.5' />
              <span>Gästebuch</span>
            </a>
          </div>
        </div>

        {/* Editorial Story Title */}
        <div className='max-w-3xl'>
          <div className='flex flex-wrap items-center gap-2 mb-3'>
            <span className='text-[11px] font-mono tracking-widest uppercase text-muted-foreground'>
              {formattedDate}
            </span>
            <span className='text-muted-foreground/40'>•</span>
            <span className='text-[11px] font-mono tracking-widest uppercase text-muted-foreground'>
              {photos.length > 1
                ? `${photos.length} AUFNAHMEN`
                : 'EINZELAUFNAHME'}
            </span>
            {collections.map((c) => (
              <Badge
                key={c.id}
                variant='outline'
                className='text-[10px] uppercase font-mono tracking-wider px-1.5 py-0 h-4 border-muted-foreground/30'
              >
                {c.name}
              </Badge>
            ))}
          </div>

          <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight text-foreground leading-[1.08] mb-4'>
            {post.title}
          </h1>
        </div>
      </header>

      {/* 2. EDITORIAL BUILDING BLOCKS ENGINE (Viewport-Fitted Zero-Crop) */}
      <div className='space-y-12 md:space-y-20'>
        {blocks.map((block, bIdx) => {
          /* ─────────────────────────────────────────────────────────────
           * BUILDING BLOCK 1: [ HERO BLEED ]
           * Strictly never taller than viewport height, never wider than width,
           * 100% native aspect ratio preserved. Opens lightbox on click!
           * ───────────────────────────────────────────────────────────── */
          if (block.type === 'hero') {
            const photo = block.photo;
            const ratio =
              photo.aspectRatio ||
              (photo.width && photo.height
                ? photo.width / photo.height
                : 3 / 2);

            return (
              <section key={`hero-${photo.id}`} className='space-y-4'>
                <div className='flex items-center justify-center w-full'>
                  <div
                    onClick={() => setLightboxIndex(block.index)}
                    className='relative overflow-hidden bg-muted/20 border border-border/40 group select-none cursor-zoom-in'
                    style={{
                      aspectRatio: `${ratio}`,
                      maxHeight: 'min(86vh, calc(100dvh - 5rem))',
                      width: `min(100%, calc(min(86vh, calc(100dvh - 5rem)) * ${ratio}))`,
                      maxWidth: '100%',
                    }}
                  >
                    <BlurImage
                      src={keyToUrl(photo.url)}
                      alt={photo.title || post.title}
                      fill
                      blurhash={photo.blurData}
                      aspectRatio={ratio}
                      className='object-contain w-full h-full'
                      priority
                      sizes='(max-width: 1024px) 100vw, 1200px'
                    />

                    {/* Actions overlay (Top Right) */}
                    <div className='absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20'>
                      <a
                        href={createPrintInquiryUrl(photo)}
                        onClick={(e) => e.stopPropagation()}
                        className='p-2 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-colors'
                        title='Print anfragen'
                        aria-label='Print dieser Aufnahme anfragen'
                      >
                        <IconMail className='size-4' />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxIndex(block.index);
                        }}
                        className='p-2 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-colors cursor-pointer'
                        aria-label='Foto vergrößern'
                      >
                        <IconArrowsMaximize className='size-4' />
                      </button>
                    </div>

                    {/* Discrete bottom technical provenance badge */}
                    {(photo.make || photo.lensModel || photo.focalLength) && (
                      <div className='absolute bottom-3 left-3 px-2.5 py-1 rounded-sm bg-background/80 backdrop-blur-md text-[11px] font-mono tracking-tight text-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block'>
                        {[
                          photo.make && photo.model
                            ? `${photo.make} ${photo.model}`
                            : photo.make || photo.model,
                          photo.lensModel,
                          photo.focalLength ? `${photo.focalLength}mm` : null,
                          photo.fNumber ? `f/${photo.fNumber}` : null,
                          photo.iso ? `ISO ${photo.iso}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────
                 * BUILDING BLOCK 2: [ FIELD NOTE ]
                 * Positioned immediately under the hero bleed anchor
                 * ───────────────────────────────────────────────────────── */}
                <div className='max-w-2xl mx-auto pt-6 md:pt-10'>
                  {post.content ? (
                    <div className='border-l-2 border-foreground/30 pl-6 py-2 my-2'>
                      <p className='font-serif text-lg sm:text-xl md:text-2xl leading-relaxed text-foreground/90 whitespace-pre-line italic'>
                        {post.content}
                      </p>
                    </div>
                  ) : (
                    <div className='border-l-2 border-border/50 pl-6 py-2 my-2 text-muted-foreground font-serif italic text-sm md:text-base'>
                      Feldnotizen aus dem Journal. Eine visuelle Aufnahmeserie
                      von Manuel Lippmann.
                    </div>
                  )}
                </div>
              </section>
            );
          }

          /* ─────────────────────────────────────────────────────────────
           * BUILDING BLOCK 3: [ DIPTYCH (PAIR) ]
           * Strict zero-crop proportional flexbox: both images share equal
           * height, never exceed viewport height or width.
           * ───────────────────────────────────────────────────────────── */
          if (block.type === 'diptych') {
            const [photoA, photoB] = block.photos;
            const ratioA =
              photoA.aspectRatio ||
              (photoA.width && photoA.height
                ? photoA.width / photoA.height
                : 1);
            const ratioB =
              photoB.aspectRatio ||
              (photoB.width && photoB.height
                ? photoB.width / photoB.height
                : 1);

            return (
              <section
                key={`diptych-${photoA.id}-${photoB.id}`}
                className='w-full'
              >
                <div className='flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 w-full'>
                  {/* Photo A */}
                  <div
                    onClick={() => setLightboxIndex(block.startIndex)}
                    className='w-full md:w-auto relative group overflow-hidden bg-muted/20 border border-border/40 select-none cursor-zoom-in flex items-center justify-center'
                    style={{
                      flex: `${ratioA} 1 0%`,
                      maxHeight: 'min(82vh, calc(100dvh - 6rem))',
                      maxWidth: '100%',
                    }}
                  >
                    <div
                      style={{
                        aspectRatio: `${ratioA}`,
                        maxHeight: 'min(82vh, calc(100dvh - 6rem))',
                        width: `min(100%, calc(min(82vh, calc(100dvh - 6rem)) * ${ratioA}))`,
                      }}
                      className='relative w-full'
                    >
                      <BlurImage
                        src={keyToUrl(photoA.url)}
                        alt={photoA.title || post.title}
                        fill
                        blurhash={photoA.blurData}
                        aspectRatio={ratioA}
                        className='object-contain w-full h-full'
                        sizes='(max-width: 768px) 100vw, 50vw'
                      />
                      <div className='absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20'>
                        <a
                          href={createPrintInquiryUrl(photoA)}
                          onClick={(e) => e.stopPropagation()}
                          className='p-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-colors'
                          title='Print anfragen'
                          aria-label='Print anfragen'
                        >
                          <IconMail className='size-3.5' />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxIndex(block.startIndex);
                          }}
                          className='p-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-colors cursor-pointer'
                          aria-label='Foto vergrößern'
                        >
                          <IconArrowsMaximize className='size-3.5' />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Photo B */}
                  <div
                    onClick={() => setLightboxIndex(block.startIndex + 1)}
                    className='w-full md:w-auto relative group overflow-hidden bg-muted/20 border border-border/40 select-none cursor-zoom-in flex items-center justify-center'
                    style={{
                      flex: `${ratioB} 1 0%`,
                      maxHeight: 'min(82vh, calc(100dvh - 6rem))',
                      maxWidth: '100%',
                    }}
                  >
                    <div
                      style={{
                        aspectRatio: `${ratioB}`,
                        maxHeight: 'min(82vh, calc(100dvh - 6rem))',
                        width: `min(100%, calc(min(82vh, calc(100dvh - 6rem)) * ${ratioB}))`,
                      }}
                      className='relative w-full'
                    >
                      <BlurImage
                        src={keyToUrl(photoB.url)}
                        alt={photoB.title || post.title}
                        fill
                        blurhash={photoB.blurData}
                        aspectRatio={ratioB}
                        className='object-contain w-full h-full'
                        sizes='(max-width: 768px) 100vw, 50vw'
                      />
                      <div className='absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20'>
                        <a
                          href={createPrintInquiryUrl(photoB)}
                          onClick={(e) => e.stopPropagation()}
                          className='p-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-colors'
                          title='Print anfragen'
                          aria-label='Print anfragen'
                        >
                          <IconMail className='size-3.5' />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxIndex(block.startIndex + 1);
                          }}
                          className='p-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-colors cursor-pointer'
                          aria-label='Foto vergrößern'
                        >
                          <IconArrowsMaximize className='size-3.5' />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          /* ─────────────────────────────────────────────────────────────
           * BUILDING BLOCK 4: [ CONTACT STRIP / SEQUENCE FRAMES ]
           * Film frame strip aesthetic with frame numbers [01], [02], [03]
           * Mobile: smooth horizontal swipe strip with scroll-snap
           * Desktop: rhythmic multi-column contact gallery
           * ───────────────────────────────────────────────────────────── */
          if (block.type === 'contact-strip') {
            return (
              <section
                key={`contact-strip-${bIdx}`}
                className='w-full space-y-3'
              >
                <div className='flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-muted-foreground/70 border-b border-border/30 pb-1.5'>
                  <span>Sequenz</span>
                  <span>•</span>
                  <span>
                    Frames #{block.startIndex + 1}–
                    {block.startIndex + block.photos.length}
                  </span>
                </div>

                {/* Mobile scroll-snap strip / Desktop grid */}
                <div className='flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto snap-x snap-mandatory pb-3 no-scrollbar -mx-3 px-3 md:mx-0 md:px-0'>
                  {block.photos.map((photo, pIdx) => {
                    const actualIndex = block.startIndex + pIdx;
                    const ratio =
                      photo.aspectRatio ||
                      (photo.width && photo.height
                        ? photo.width / photo.height
                        : 3 / 2);

                    return (
                      <div
                        key={photo.id}
                        className='shrink-0 w-[78vw] sm:w-[50vw] md:w-auto snap-center space-y-2'
                      >
                        <div
                          onClick={() => setLightboxIndex(actualIndex)}
                          className='relative overflow-hidden bg-muted/20 border border-border/40 group select-none cursor-zoom-in'
                          style={{
                            aspectRatio: `${ratio}`,
                            maxHeight: 'min(70vh, calc(100dvh - 8rem))',
                          }}
                        >
                          <BlurImage
                            src={keyToUrl(photo.url)}
                            alt={photo.title || `Frame #${actualIndex + 1}`}
                            fill
                            blurhash={photo.blurData}
                            aspectRatio={ratio}
                            className='object-contain w-full h-full'
                            sizes='(max-width: 768px) 80vw, 300px'
                          />
                          <div className='absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20'>
                            <a
                              href={createPrintInquiryUrl(photo)}
                              onClick={(e) => e.stopPropagation()}
                              className='p-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-colors'
                              title='Print anfragen'
                              aria-label='Print anfragen'
                            >
                              <IconMail className='size-3' />
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(actualIndex);
                              }}
                              className='p-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-colors cursor-pointer'
                              aria-label='Foto vergrößern'
                            >
                              <IconArrowsMaximize className='size-3' />
                            </button>
                          </div>
                        </div>
                        <div className='flex items-center justify-between text-[10px] font-mono text-muted-foreground'>
                          <span>
                            [{String(actualIndex + 1).padStart(2, '0')}]
                          </span>
                          {photo.focalLength && (
                            <span>{photo.focalLength}mm</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          }

          /* ─────────────────────────────────────────────────────────────
           * SOLO FEATURE FRAME
           * Breathing room / detail highlight, viewport-fitted!
           * ───────────────────────────────────────────────────────────── */
          if (block.type === 'solo') {
            const photo = block.photo;
            const ratio =
              photo.aspectRatio ||
              (photo.width && photo.height
                ? photo.width / photo.height
                : 3 / 2);

            return (
              <section
                key={`solo-${photo.id}`}
                className='max-w-4xl mx-auto space-y-3'
              >
                <div className='flex items-center justify-center w-full'>
                  <div
                    onClick={() => setLightboxIndex(block.index)}
                    className='relative overflow-hidden bg-muted/20 border border-border/40 group select-none cursor-zoom-in'
                    style={{
                      aspectRatio: `${ratio}`,
                      maxHeight: 'min(86vh, calc(100dvh - 5rem))',
                      width: `min(100%, calc(min(86vh, calc(100dvh - 5rem)) * ${ratio}))`,
                      maxWidth: '100%',
                    }}
                  >
                    <BlurImage
                      src={keyToUrl(photo.url)}
                      alt={photo.title || post.title}
                      fill
                      blurhash={photo.blurData}
                      aspectRatio={ratio}
                      className='object-contain w-full h-full'
                      sizes='(max-width: 1024px) 100vw, 900px'
                    />
                    <div className='absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20'>
                      <a
                        href={createPrintInquiryUrl(photo)}
                        onClick={(e) => e.stopPropagation()}
                        className='p-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-colors'
                        title='Print anfragen'
                        aria-label='Print anfragen'
                      >
                        <IconMail className='size-3.5' />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxIndex(block.index);
                        }}
                        className='p-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-colors cursor-pointer'
                        aria-label='Foto vergrößern'
                      >
                        <IconArrowsMaximize className='size-3.5' />
                      </button>
                    </div>
                  </div>
                </div>
                {(photo.make || photo.lensModel || photo.focalLength) && (
                  <p className='text-center text-[11px] font-mono text-muted-foreground'>
                    {[
                      photo.make && photo.model
                        ? `${photo.make} ${photo.model}`
                        : photo.make || photo.model,
                      photo.lensModel,
                      photo.focalLength ? `${photo.focalLength}mm` : null,
                      photo.fNumber ? `f/${photo.fNumber}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </section>
            );
          }

          return null;
        })}
      </div>

      {/* 3. EDITORIAL FOOTER & CURATOR'S GUESTBOOK */}
      <footer
        id='guestbook'
        className='mt-20 md:mt-28 border-t border-border/60 pt-10 md:pt-14 space-y-12'
      >
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6'>
          <div>
            <Author size='md' />
            <p className='text-xs text-muted-foreground mt-1'>
              Dokumentation & Fotografie aus dem Alltag.
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => {
                if (fingerprint && isLoaded) {
                  toggleLike.mutate({
                    postId: post.id,
                    userFingerprint: fingerprint,
                  });
                }
              }}
              className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background hover:bg-muted text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer'
            >
              <IconHeartFilled
                className={cn(
                  'size-4 transition-colors',
                  currentInteractions?.hasLiked
                    ? 'text-red-500 fill-red-500'
                    : 'text-muted-foreground',
                )}
              />
              <span>{currentInteractions?.likeCount || 0} Gefällt mir</span>
            </button>
            <button
              onClick={handleShare}
              className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background hover:bg-muted text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer'
            >
              {copied ? (
                <>
                  <IconCheck className='size-4 text-emerald-500' />
                  <span className='text-emerald-500'>Kopiert</span>
                </>
              ) : (
                <>
                  <IconShare className='size-4' />
                  <span>Teilen</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Curator's Guestbook (Gästebuch) */}
        <div className='bg-muted/30 border border-border/40 rounded-lg p-4 sm:p-6 md:p-8 max-w-3xl mx-auto'>
          <h3 className='text-lg font-medium tracking-tight mb-6 flex items-center gap-2'>
            <IconMessageCircle className='size-5 text-muted-foreground' />
            <span>Gästebuch der Serie</span>
          </h3>
          <SocialInteractions postId={post.id} variant='full' />
        </div>
      </footer>

      {/* 4. FULLSCREEN LIGHTBOX DIALOG (100% Zoom, Swipes, Cycling & Full EXIF) */}
      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLightboxIndex(null);
            setIsZoomed(false);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className='bg-black/95 border-none max-w-screen! w-screen! h-screen! max-h-screen! p-0 m-0 rounded-none flex flex-col justify-between z-50 text-white overflow-hidden'
        >
          <DialogTitle className='sr-only'>Foto Großansicht</DialogTitle>

          {lightboxIndex !== null && photos[lightboxIndex] && (
            <div
              className='relative w-full h-full flex flex-col justify-between select-none overflow-hidden'
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Top Controls Bar */}
              <div className='flex items-center justify-between z-20 text-white/80 p-3 sm:p-5 bg-linear-to-b from-black/80 to-transparent'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <span className='text-xs font-mono tracking-widest uppercase bg-white/10 px-2 py-0.5 rounded-sm'>
                    {String(lightboxIndex + 1).padStart(2, '0')} /{' '}
                    {String(photos.length).padStart(2, '0')}
                  </span>
                  <span className='text-xs font-mono text-white/60 hidden sm:inline truncate max-w-xs'>
                    {photos[lightboxIndex].title || post.title}
                  </span>
                </div>

                {/* Actions & Zoom Toggle */}
                <div className='flex items-center gap-2 sm:gap-3'>
                  <button
                    onClick={() => setIsZoomed((prev) => !prev)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer',
                      isZoomed
                        ? 'bg-white text-black'
                        : 'bg-white/10 hover:bg-white/20 text-white',
                    )}
                    title={isZoomed ? 'Zoom zurücksetzen' : '100% Zoom'}
                  >
                    {isZoomed ? (
                      <>
                        <IconZoomOut className='size-3.5' />
                        <span>Einpassen</span>
                      </>
                    ) : (
                      <>
                        <IconZoomIn className='size-3.5' />
                        <span>100% Zoom</span>
                      </>
                    )}
                  </button>

                  <a
                    href={createPrintInquiryUrl(photos[lightboxIndex])}
                    className='px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1.5'
                  >
                    <IconMail className='size-3.5' />
                    <span className='hidden sm:inline'>Print anfragen</span>
                  </a>

                  <button
                    onClick={() => {
                      if (fingerprint && isLoaded) {
                        toggleLike.mutate({
                          postId: post.id,
                          userFingerprint: fingerprint,
                        });
                      }
                    }}
                    className='p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1'
                    aria-label='Serie liken'
                  >
                    <IconHeartFilled
                      className={cn(
                        'size-4 transition-colors',
                        currentInteractions?.hasLiked
                          ? 'text-red-500 fill-red-500'
                          : 'text-white',
                      )}
                    />
                    <span className='text-xs font-mono'>
                      {currentInteractions?.likeCount || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setLightboxIndex(null);
                      setIsZoomed(false);
                    }}
                    className='p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer'
                    aria-label='Schließen (Esc)'
                  >
                    <IconX className='size-5' />
                  </button>
                </div>
              </div>

              {/* Main Image Stage (100% Zoomable on Click / Tap) */}
              <div
                className='relative grow flex items-center justify-center min-h-0 w-full overflow-hidden'
                onClick={handleImageZoomClick}
              >
                <div
                  className={cn(
                    'relative max-w-full max-h-full flex items-center justify-center transition-transform duration-300 ease-out',
                    isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in',
                  )}
                  style={{
                    transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                  }}
                >
                  <BlurImage
                    src={keyToUrl(photos[lightboxIndex].url)}
                    alt={photos[lightboxIndex].title || post.title}
                    width={photos[lightboxIndex].width}
                    height={photos[lightboxIndex].height}
                    blurhash={photos[lightboxIndex].blurData}
                    aspectRatio={photos[lightboxIndex].aspectRatio}
                    className='max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-7.5rem)] object-contain select-none pointer-events-none'
                    sizes='100vw'
                    priority
                  />
                </div>

                {/* Left/Right Prev/Next Buttons (Visible when not zoomed) */}
                {photos.length > 1 && !isZoomed && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevPhoto();
                      }}
                      className='absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white transition-colors cursor-pointer z-30'
                      aria-label='Vorheriges Foto (Pfeiltaste links)'
                    >
                      <IconChevronLeft className='size-6' />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextPhoto();
                      }}
                      className='absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white transition-colors cursor-pointer z-30'
                      aria-label='Nächstes Foto (Pfeiltaste rechts)'
                    >
                      <IconChevronRight className='size-6' />
                    </button>
                  </>
                )}
              </div>

              {/* Bottom Full EXIF Information Bar */}
              <div className='z-20 text-white/80 p-3 sm:p-4 bg-linear-to-t from-black/90 to-transparent border-t border-white/10'>
                <div className='flex flex-wrap items-center justify-between gap-y-2 gap-x-4 max-w-6xl mx-auto text-xs font-mono'>
                  {/* Camera & Lens Details */}
                  <div className='flex items-center gap-2 flex-wrap'>
                    <IconCamera className='size-3.5 text-white/50 shrink-0' />
                    <span className='font-medium text-white'>
                      {[
                        photos[lightboxIndex].make && photos[lightboxIndex].model
                          ? `${photos[lightboxIndex].make} ${photos[lightboxIndex].model}`
                          : photos[lightboxIndex].make || photos[lightboxIndex].model,
                      ]
                        .filter(Boolean)
                        .join(' ') || 'Kamera'}
                    </span>
                    {photos[lightboxIndex].lensModel && (
                      <>
                        <span className='text-white/30'>·</span>
                        <span className='text-white/80'>
                          {photos[lightboxIndex].lensModel}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Exposure Parameters */}
                  <div className='flex items-center gap-2 flex-wrap text-white/70'>
                    {photos[lightboxIndex].focalLength && (
                      <span>{photos[lightboxIndex].focalLength}mm</span>
                    )}
                    {photos[lightboxIndex].fNumber && (
                      <>
                        <span className='text-white/30'>·</span>
                        <span>f/{photos[lightboxIndex].fNumber}</span>
                      </>
                    )}
                    {photos[lightboxIndex].exposureTime && (
                      <>
                        <span className='text-white/30'>·</span>
                        <span>
                          1/{Math.round(1 / photos[lightboxIndex].exposureTime!)}s
                        </span>
                      </>
                    )}
                    {photos[lightboxIndex].iso && (
                      <>
                        <span className='text-white/30'>·</span>
                        <span>ISO {photos[lightboxIndex].iso}</span>
                      </>
                    )}
                    {photos[lightboxIndex].width &&
                      photos[lightboxIndex].height && (
                        <>
                          <span className='text-white/30 hidden md:inline'>
                            ·
                          </span>
                          <span className='text-white/40 hidden md:inline'>
                            {photos[lightboxIndex].width} ×{' '}
                            {photos[lightboxIndex].height}
                          </span>
                        </>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </article>
  );
};
