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
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import { ScrollReveal } from '@/components/scroll-reveal';

interface EditorialStoryViewProps {
  post: PostGetOne;
}

type EditorialBlock =
  | { type: 'hero'; photo: Photo; index: number }
  | { type: 'diptych'; photos: [Photo, Photo]; startIndex: number }
  | { type: 'solo'; photo: Photo; index: number };

export const EditorialStoryView = ({ post }: EditorialStoryViewProps) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { fingerprint, isLoaded } = useIdentity();

  const [copied, setCopied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentScale, setCurrentScale] = useState(1);
  const [isCurrentlyDragging, setIsCurrentlyDragging] = useState(false);

  const transformComponentRef = useRef<ReactZoomPanPinchRef>(null);
  const isPanningRef = useRef(false);
  const ignoreClickRef = useRef(false);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const pointerStartTime = useRef<number>(0);
  const didMovePointer = useRef(false);
  const handledByPointerUp = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const hasTouchMoved = useRef(false);

  const isZoomed = currentScale > 1.05;

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
    let lastWasPair = false;
    let soloStreak = 0;

    while (i < remaining.length) {
      const left = remaining.length - i;

      if (lastWasPair) {
        // STRICT RULE: Never add two images next to each other after each other.
        // After any pair (diptych), the next block MUST be a full size single image (solo).
        result.push({
          type: 'solo',
          photo: remaining[i],
          index: i + 1,
        });
        i += 1;
        lastWasPair = false;
        soloStreak = 1;
      } else {
        // Previous was NOT a pair (it was hero or solo).
        if (left >= 2) {
          const photoA = remaining[i];
          const photoB = remaining[i + 1];
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

          // We pair when:
          // 1) Exactly 2 photos remain (fits cleanly as a closing pair)
          // 2) Exactly 3 photos remain (pair then single)
          // 3) Both photos are vertical (ratio < 1.15)
          // 4) Or we already had 1+ single images and want to mix it up
          const bothVertical = ratioA < 1.15 && ratioB < 1.15;
          const shouldPair =
            left === 2 ||
            left === 3 ||
            bothVertical ||
            soloStreak >= 1 ||
            i % 3 === 0;

          if (shouldPair) {
            result.push({
              type: 'diptych',
              photos: [photoA, photoB],
              startIndex: i + 1,
            });
            i += 2;
            lastWasPair = true;
            soloStreak = 0;
          } else {
            // Full size single image
            result.push({
              type: 'solo',
              photo: photoA,
              index: i + 1,
            });
            i += 1;
            lastWasPair = false;
            soloStreak += 1;
          }
        } else {
          // Exactly 1 photo remaining -> solo full size single image
          result.push({
            type: 'solo',
            photo: remaining[i],
            index: i + 1,
          });
          i += 1;
          lastWasPair = false;
          soloStreak += 1;
        }
      }
    }

    return result;
  }, [photos]);

  const hasFieldNote = Boolean(post.content && post.content.trim().length > 0);

  // Pacing for mixed sticky interactions & scroll reveal animations:
  // - Hero (block 0) pins if there are subsequent blocks
  // - Sparingly pick occasional solo frames (e.g. index 3, 6...) that aren't the last block
  const isStickyPin = useCallback(
    (bIdx: number) => {
      if (bIdx === 0) return blocks.length > 1;
      if (bIdx >= 3 && bIdx < blocks.length - 1) {
        return blocks[bIdx].type === 'solo' && bIdx % 3 === 0;
      }
      return false;
    },
    [blocks],
  );

  const isOverlayBlock = useCallback(
    (bIdx: number) => {
      if (bIdx === 0) return false;
      if (bIdx === 1) {
        // If there's a field note, that already overlayed the pinned hero;
        // if no field note, block 1 directly overlays the hero!
        return isStickyPin(0) && !hasFieldNote;
      }
      return isStickyPin(bIdx - 1);
    },
    [isStickyPin, hasFieldNote],
  );

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link in Zwischenablage kopiert');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const createSeriesPrintInquiryUrl = () => {
    const subject = encodeURIComponent(
      `Print-Anfrage: Serie „${post.title}“`,
    );
    const body = encodeURIComponent(
      `Hallo Manuel,\n\nich interessiere mich für einen Fine-Art Print aus deiner Serie „${post.title}“:\n\n• Serie: ${post.title}\n• Motiv / Wunschfoto: [z. B. Titel oder Bildnummer]\n\nBitte gib mir unverbindlich Bescheid über verfügbare Formate, Papiersorten und Konditionen.\n\nViele Grüße`,
    );
    return `mailto:manuel@lippe-mann.de?subject=${subject}&body=${body}`;
  };

  // Cycling photos in lightbox
  const handleNextPhoto = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % photos.length : null,
    );
    setCurrentScale(1);
  }, [photos.length]);

  const handlePrevPhoto = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + photos.length) % photos.length : null,
    );
    setCurrentScale(1);
  }, [photos.length]);

  // Reset scale and gesture tracking on slide change
  useEffect(() => {
    setCurrentScale(1);
    isPanningRef.current = false;
    ignoreClickRef.current = false;
    pointerDownPos.current = null;
    didMovePointer.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
    hasTouchMoved.current = false;
  }, [lightboxIndex]);

  // Pointer drag tracking to ensure drag releases never accidentally toggle zoom
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button') || target?.closest('a')) {
      pointerDownPos.current = null;
      return;
    }
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    pointerStartTime.current = Date.now();
    didMovePointer.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerDownPos.current) return;
    const dist = Math.hypot(
      e.clientX - pointerDownPos.current.x,
      e.clientY - pointerDownPos.current.y,
    );
    if (dist > 8) {
      didMovePointer.current = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerDownPos.current) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('button') || target?.closest('a')) {
      pointerDownPos.current = null;
      return;
    }

    const dist = Math.hypot(
      e.clientX - pointerDownPos.current.x,
      e.clientY - pointerDownPos.current.y,
    );
    const elapsed = Date.now() - pointerStartTime.current;
    const wasTap = !didMovePointer.current && dist <= 8 && elapsed < 500;

    pointerDownPos.current = null;
    didMovePointer.current = false;

    if (wasTap) {
      handledByPointerUp.current = true;
      setTimeout(() => {
        handledByPointerUp.current = false;
      }, 200);

      if (isZoomed) {
        // ONE SINGLE TAP / CLICK UNZOOMS TO FIT IMMEDIATELY
        transformComponentRef.current?.resetTransform(300, 'easeOut');
        setCurrentScale(1);
      } else {
        // SINGLE TAP / CLICK ZOOMS TO 100% AT TAP POSITION
        transformComponentRef.current?.zoomToPoint(
          2.5,
          e.clientX,
          e.clientY,
          300,
          'easeOut',
        );
      }
    }
  };

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
        setCurrentScale(1);
      }
    },
    [lightboxIndex, handleNextPhoto, handlePrevPhoto],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch gesture support in lightbox: single-finger horizontal swipe navigates when fitted
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return;
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      hasTouchMoved.current = false;
    } else {
      touchStartX.current = null;
      touchStartY.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (e.touches.length === 1) {
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (deltaX > 10 || deltaY > 10) {
        hasTouchMoved.current = true;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (hasTouchMoved.current) {
      ignoreClickRef.current = true;
      setTimeout(() => {
        ignoreClickRef.current = false;
      }, 200);
    }

    if (
      isZoomed ||
      touchStartX.current === null ||
      touchStartY.current === null
    ) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

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

  // Single click/tap fallback (when click is dispatched without pointerup or vice versa)
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      handledByPointerUp.current ||
      isPanningRef.current ||
      ignoreClickRef.current ||
      didMovePointer.current
    )
      return;

    if (!isZoomed) {
      transformComponentRef.current?.zoomToPoint(
        2.5,
        e.clientX,
        e.clientY,
        300,
        'easeOut',
      );
    } else {
      transformComponentRef.current?.resetTransform(300, 'easeOut');
      setCurrentScale(1);
    }
  };

  const handleToggleZoomButton = () => {
    if (!isZoomed) {
      transformComponentRef.current?.centerView(2.5, 300, 'easeOut');
    } else {
      transformComponentRef.current?.resetTransform(300, 'easeOut');
      setCurrentScale(1);
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
    <article className='w-full max-w-6xl mx-auto py-6 md:py-12'>
      {/* 1. TOP BREADCRUMB & UTILITY HEADER */}
      <header className='mt-10 md:mt-0 mb-8 md:mb-14'>
        <div className='hidden md:flex items-center justify-between gap-4 mb-6 border-b border-border/40 pb-4'>
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

          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-serif tracking-tight text-foreground leading-[1.12] mb-4'>
            {post.title}
          </h1>
        </div>
      </header>

      {/* 2. EDITORIAL BUILDING BLOCKS ENGINE (Viewport-Fitted Zero-Crop with Mixed Sticky & Reveal) */}
      <div className='w-full'>
        {blocks.map((block, bIdx) => {
          /* ─────────────────────────────────────────────────────────────
           * BUILDING BLOCK 1: [ HERO BLEED ]
           * Strictly never taller than viewport height, never wider than width,
           * 100% native aspect ratio preserved. Opens lightbox on click!
           * Pinned anchor when subsequent blocks exist.
           * ───────────────────────────────────────────────────────────── */
          if (block.type === 'hero') {
            const photo = block.photo;
            const ratio =
              photo.aspectRatio ||
              (photo.width && photo.height
                ? photo.width / photo.height
                : 3 / 2);
            const isHeroSticky = isStickyPin(0);

            return (
              <section
                key={`hero-${photo.id}`}
                className={cn('relative w-full', isHeroSticky && 'pb-16 md:pb-28')}
              >
                <div className={cn(isHeroSticky && 'sticky top-14 md:top-20 z-0')}>
                  <div className='flex justify-center w-full'>
                    <div
                      className='group/plate flex flex-col items-end'
                      style={{
                        width: `min(100%, calc(min(86vh, calc(100dvh - 5rem)) * ${ratio}))`,
                        maxWidth: '100%',
                      }}
                    >
                      <div
                        onClick={() => setLightboxIndex(block.index)}
                        className='w-full relative overflow-hidden bg-muted/20 border border-border/40 group/photo select-none cursor-zoom-in transition-all duration-500 ease-out hover:-translate-y-0.5 hover:border-foreground/30'
                        style={{
                          aspectRatio: `${ratio}`,
                          maxHeight: 'min(86vh, calc(100dvh - 5rem))',
                        }}
                      >
                        <BlurImage
                          src={keyToUrl(photo.url)}
                          alt={photo.title || post.title}
                          fill
                          blurhash={photo.blurData}
                          aspectRatio={ratio}
                          className='object-contain w-full h-full transition-transform duration-700 ease-out group-hover/photo:scale-[1.01]'
                          priority
                          sizes='(max-width: 1024px) 100vw, 1200px'
                        />

                        {/* Actions overlay (Top Right) */}
                        <div className='absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover/photo:opacity-100 transition-opacity z-20'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxIndex(block.index);
                            }}
                            className='p-2 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer'
                            aria-label='Foto vergrößern'
                          >
                            <IconArrowsMaximize className='size-4' />
                          </button>
                        </div>
                      </div>

                      {/* Frame number outside image (Bottom Right) */}
                      <div className='pt-2 text-[10px] sm:text-[11px] font-mono tracking-widest text-muted-foreground/80 group-hover/plate:text-foreground transition-colors duration-300 select-none'>
                        <span>{String(block.index + 1).padStart(2, '0')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────
                 * BUILDING BLOCK 2: [ FIELD NOTE ]
                 * Positioned immediately under the hero bleed anchor if provided.
                 * Glides smoothly over the hero photo if hero was pinned!
                 * ───────────────────────────────────────────────────────── */}
                {hasFieldNote && (
                  <div
                    className={cn(
                      'max-w-2xl mx-auto px-4',
                      isHeroSticky
                        ? 'relative z-10 bg-background pt-10 pb-6 shadow-[0_-16px_32px_-12px_rgba(0,0,0,0.10)] dark:shadow-[0_-16px_32px_-12px_rgba(0,0,0,0.4)]'
                        : 'pt-8 md:pt-14',
                    )}
                  >
                    <ScrollReveal>
                      <div className='border-l-2 border-foreground/30 pl-6 py-2 my-2'>
                        <p className='font-serif text-lg sm:text-xl md:text-2xl leading-relaxed text-foreground/90 whitespace-pre-line italic'>
                          {post.content!.trim()}
                        </p>
                      </div>
                    </ScrollReveal>
                  </div>
                )}
              </section>
            );
          }

          /* ─────────────────────────────────────────────────────────────
           * BUILDING BLOCK 3: [ DIPTYCH (PAIR) ]
           * Strict zero-crop proportional flexbox: both images share equal
           * height, never exceed viewport height or width.
           * Plate numbers placed directly below each photo (Bottom Right).
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

            const isOverlay = isOverlayBlock(bIdx);

            return (
              <section
                key={`diptych-${photoA.id}-${photoB.id}`}
                className={cn(
                  'w-full',
                  isOverlay
                    ? 'relative z-10 bg-background pt-10 md:pt-16 pb-4 shadow-[0_-16px_32px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_-16px_32px_-12px_rgba(0,0,0,0.4)]'
                    : 'mt-16 md:mt-28',
                )}
              >
                <ScrollReveal>
                  <div className='flex flex-col md:flex-row items-center md:items-start justify-center gap-8 w-full'>
                    {/* Photo A */}
                    <div
                      className='w-full md:w-auto flex flex-col items-end group/plate md:flex-[var(--ratio-a)_1_0%]'
                      style={
                        {
                          '--ratio-a': ratioA,
                          maxWidth: `min(100%, calc(min(82vh, calc(100dvh - 6rem)) * ${ratioA}))`,
                        } as React.CSSProperties
                      }
                    >
                      <div
                        onClick={() => setLightboxIndex(block.startIndex)}
                        className='w-full relative group/photo overflow-hidden bg-muted/20 border border-border/40 select-none cursor-zoom-in transition-all duration-500 ease-out hover:-translate-y-0.5 hover:border-foreground/30'
                        style={{
                          aspectRatio: `${ratioA}`,
                          maxHeight: 'min(82vh, calc(100dvh - 6rem))',
                        }}
                      >
                        <BlurImage
                          src={keyToUrl(photoA.url)}
                          alt={photoA.title || post.title}
                          fill
                          blurhash={photoA.blurData}
                          aspectRatio={ratioA}
                          className='object-contain w-full h-full transition-transform duration-700 ease-out group-hover/photo:scale-[1.01]'
                          sizes='(max-width: 768px) 100vw, 50vw'
                        />
                        <div className='absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover/photo:opacity-100 transition-opacity z-20'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxIndex(block.startIndex);
                            }}
                            className='p-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer'
                            aria-label='Foto vergrößern'
                          >
                            <IconArrowsMaximize className='size-3.5' />
                          </button>
                        </div>
                      </div>

                      {/* Frame index number outside Photo A (Bottom Right) */}
                      <div className='pt-2 text-[10px] sm:text-[11px] font-mono tracking-widest text-muted-foreground/80 group-hover/plate:text-foreground transition-colors duration-300 select-none'>
                        <span>{String(block.startIndex + 1).padStart(2, '0')}</span>
                      </div>
                    </div>

                    {/* Photo B */}
                    <div
                      className='w-full md:w-auto flex flex-col items-end group/plate md:flex-[var(--ratio-b)_1_0%]'
                      style={
                        {
                          '--ratio-b': ratioB,
                          maxWidth: `min(100%, calc(min(82vh, calc(100dvh - 6rem)) * ${ratioB}))`,
                        } as React.CSSProperties
                      }
                    >
                      <div
                        onClick={() => setLightboxIndex(block.startIndex + 1)}
                        className='w-full relative group/photo overflow-hidden bg-muted/20 border border-border/40 select-none cursor-zoom-in transition-all duration-500 ease-out hover:-translate-y-0.5 hover:border-foreground/30'
                        style={{
                          aspectRatio: `${ratioB}`,
                          maxHeight: 'min(82vh, calc(100dvh - 6rem))',
                        }}
                      >
                        <BlurImage
                          src={keyToUrl(photoB.url)}
                          alt={photoB.title || post.title}
                          fill
                          blurhash={photoB.blurData}
                          aspectRatio={ratioB}
                          className='object-contain w-full h-full transition-transform duration-700 ease-out group-hover/photo:scale-[1.01]'
                          sizes='(max-width: 768px) 100vw, 50vw'
                        />
                        <div className='absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover/photo:opacity-100 transition-opacity z-20'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxIndex(block.startIndex + 1);
                            }}
                            className='p-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer'
                            aria-label='Foto vergrößern'
                          >
                            <IconArrowsMaximize className='size-3.5' />
                          </button>
                        </div>
                      </div>

                      {/* Frame index number outside Photo B (Bottom Right) */}
                      <div className='pt-2 text-[10px] sm:text-[11px] font-mono tracking-widest text-muted-foreground/80 group-hover/plate:text-foreground transition-colors duration-300 select-none'>
                        <span>{String(block.startIndex + 2).padStart(2, '0')}</span>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </section>
            );
          }

          /* ─────────────────────────────────────────────────────────────
           * SOLO FEATURE FRAME
           * Breathing room / detail highlight, viewport-fitted!
           * Plate number placed directly below photo (Bottom Right).
           * Sticky pin if isStickyPin(bIdx), or overlay if isOverlayBlock(bIdx),
           * or clean normal flow with ScrollReveal!
           * ───────────────────────────────────────────────────────────── */
          if (block.type === 'solo') {
            const photo = block.photo;
            const ratio =
              photo.aspectRatio ||
              (photo.width && photo.height
                ? photo.width / photo.height
                : 3 / 2);

            const isPin = isStickyPin(bIdx);
            const isOverlay = isOverlayBlock(bIdx);

            return (
              <section
                key={`solo-${photo.id}`}
                className={cn(
                  'w-full',
                  isPin && 'relative pb-16 md:pb-28 mt-16 md:mt-28',
                  isOverlay &&
                    'relative z-10 bg-background pt-10 md:pt-16 pb-4 shadow-[0_-16px_32px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_-16px_32px_-12px_rgba(0,0,0,0.4)]',
                  !isPin && !isOverlay && 'mt-16 md:mt-28',
                )}
              >
                <div className={cn(isPin && 'sticky top-14 md:top-20 z-0')}>
                  <ScrollReveal>
                    <div className='flex justify-center w-full max-w-5xl mx-auto'>
                      <div
                        className='group/plate flex flex-col items-end'
                        style={{
                          width: `min(100%, calc(min(86vh, calc(100dvh - 5rem)) * ${ratio}))`,
                          maxWidth: '100%',
                        }}
                      >
                        <div
                          onClick={() => setLightboxIndex(block.index)}
                          className='w-full relative overflow-hidden bg-muted/20 border border-border/40 group/photo select-none cursor-zoom-in transition-all duration-500 ease-out hover:-translate-y-0.5 hover:border-foreground/30'
                          style={{
                            aspectRatio: `${ratio}`,
                            maxHeight: 'min(86vh, calc(100dvh - 5rem))',
                          }}
                        >
                          <BlurImage
                            src={keyToUrl(photo.url)}
                            alt={photo.title || post.title}
                            fill
                            blurhash={photo.blurData}
                            aspectRatio={ratio}
                            className='object-contain w-full h-full transition-transform duration-700 ease-out group-hover/photo:scale-[1.01]'
                            sizes='(max-width: 1024px) 100vw, 900px'
                          />
                          <div className='absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover/photo:opacity-100 transition-opacity z-20'>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(block.index);
                              }}
                              className='p-1.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer'
                              aria-label='Foto vergrößern'
                            >
                              <IconArrowsMaximize className='size-3.5' />
                            </button>
                          </div>
                        </div>

                        {/* Frame number outside Solo image (Bottom Right) */}
                        <div className='pt-2 text-[10px] sm:text-[11px] font-mono tracking-widest text-muted-foreground/80 group-hover/plate:text-foreground transition-colors duration-300 select-none'>
                          <span>{String(block.index + 1).padStart(2, '0')}</span>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              </section>
            );
          }

          return null;
        })}
      </div>

      {/* 2.5 EDITORIAL COLOPHON (Fine-Art Prints on demand) */}
      <section className='relative z-20 bg-background mt-16 md:mt-24 pt-10 border-t border-border/40 max-w-xl mx-auto text-center space-y-3 px-4'>
        <span className='text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-foreground'>
          Fine-Art Prints & Abzüge
        </span>
        <p className='text-xs sm:text-sm text-muted-foreground font-serif italic max-w-md mx-auto leading-relaxed'>
          Als unabhängiger Fotograf fertige ich ausgewählte Aufnahmen dieser Serie gerne als hochwertigen Fine-Art Print auf Anfrage an.
        </p>
        <div className='pt-1'>
          <a
            href={createSeriesPrintInquiryUrl()}
            className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/70 bg-background hover:bg-muted text-[11px] sm:text-xs font-mono uppercase tracking-wider transition-colors text-foreground/80 hover:text-foreground'
          >
            <IconMail className='size-3.5 text-muted-foreground' />
            <span>Print zu dieser Serie anfragen</span>
          </a>
        </div>
      </section>

      {/* 3. EDITORIAL FOOTER & CURATOR'S GUESTBOOK */}
      <footer
        id='guestbook'
        className='relative z-20 bg-background mt-14 md:mt-20 border-t border-border/60 pt-10 md:pt-14 space-y-12'
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

      {/* 4. FULLSCREEN LIGHTBOX DIALOG (100% Zoom, Drag/Pan, Pinch & Full EXIF) */}
      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLightboxIndex(null);
            setCurrentScale(1);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className='fixed! inset-0! top-0! left-0! right-0! bottom-0! translate-x-0! translate-y-0! transform-none! w-full! max-w-full! h-[100dvh]! max-h-[100dvh]! bg-black/95 border-none p-0! m-0! gap-0! rounded-none! flex flex-col justify-between z-50 text-white overflow-hidden'
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: 'none',
            width: '100vw',
            height: '100dvh',
            maxHeight: '100dvh',
          }}
        >
          <DialogTitle className='sr-only'>Foto Großansicht</DialogTitle>

          {lightboxIndex !== null && photos[lightboxIndex] && (
            <div
              className='relative w-full h-[100dvh] max-h-[100dvh] flex flex-col justify-between select-none overflow-hidden touch-none'
              style={{ height: '100dvh', maxHeight: '100dvh' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Top Controls Bar */}
              <div
                className='shrink-0 w-full flex items-center justify-between z-30 text-white/90 px-3 sm:px-5 pb-2 sm:pb-3 bg-linear-to-b from-black/95 via-black/80 to-transparent'
                style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))' }}
              >
                <div className='flex items-center gap-2 sm:gap-3 min-w-0'>
                  <span className='text-[11px] sm:text-xs font-mono tracking-widest uppercase bg-white/10 px-2 py-0.5 rounded-sm shrink-0'>
                    {String(lightboxIndex + 1).padStart(2, '0')} /{' '}
                    {String(photos.length).padStart(2, '0')}
                  </span>
                  <span className='text-xs font-mono text-white/70 hidden sm:inline truncate max-w-xs'>
                    {photos[lightboxIndex].title || post.title}
                  </span>
                </div>

                {/* Actions & Zoom Toggle */}
                <div className='flex items-center gap-1.5 sm:gap-2.5 shrink-0'>
                  <button
                    onClick={handleToggleZoomButton}
                    className={cn(
                      'px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0',
                      isZoomed
                        ? 'bg-white text-black font-semibold'
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

                  <button
                    onClick={() => {
                      if (fingerprint && isLoaded) {
                        toggleLike.mutate({
                          postId: post.id,
                          userFingerprint: fingerprint,
                        });
                      }
                    }}
                    className='p-1.5 sm:px-2.5 sm:py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1 shrink-0'
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
                      setCurrentScale(1);
                    }}
                    className='p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0'
                    aria-label='Schließen (Esc)'
                  >
                    <IconX className='size-5' />
                  </button>
                </div>
              </div>

              {/* Main Image Stage (Drag/Pan, Pinch & Single Click/Tap 100% Zoomable) */}
              <div
                className={cn(
                  'relative grow min-h-0 w-full flex items-center justify-center overflow-hidden select-none',
                  isZoomed
                    ? isCurrentlyDragging
                      ? 'cursor-grabbing'
                      : 'cursor-grab'
                    : 'cursor-zoom-in',
                )}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={handleStageClick}
              >
                <TransformWrapper
                  ref={transformComponentRef}
                  key={lightboxIndex}
                  initialScale={1}
                  minScale={1}
                  maxScale={5}
                  centerOnInit
                  limitToBounds
                  panning={{
                    disabled: !isZoomed,
                    velocityDisabled: false,
                    allowLeftClickPan: true,
                  }}
                  pinch={{
                    disabled: false,
                    step: 5,
                  }}
                  doubleClick={{
                    disabled: true,
                  }}
                  wheel={{
                    step: 0.15,
                    disabled: false,
                  }}
                  onPanningStart={() => {
                    isPanningRef.current = true;
                    setIsCurrentlyDragging(true);
                  }}
                  onPanningStop={() => {
                    setIsCurrentlyDragging(false);
                    setTimeout(() => {
                      isPanningRef.current = false;
                    }, 120);
                  }}
                  onTransform={(_ref, state) => {
                    setCurrentScale(state.scale);
                  }}
                >
                  <TransformComponent
                    wrapperClass='w-full h-full flex items-center justify-center overflow-hidden'
                    contentClass='w-full h-full flex items-center justify-center'
                    wrapperStyle={{ width: '100%', height: '100%' }}
                    contentStyle={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BlurImage
                      src={keyToUrl(photos[lightboxIndex].url)}
                      alt={photos[lightboxIndex].title || post.title}
                      width={photos[lightboxIndex].width}
                      height={photos[lightboxIndex].height}
                      blurhash={photos[lightboxIndex].blurData}
                      aspectRatio={photos[lightboxIndex].aspectRatio}
                      className='max-w-full max-h-full object-contain select-none pointer-events-none p-1 sm:p-2 md:p-4'
                      sizes='100vw'
                      priority
                    />
                  </TransformComponent>
                </TransformWrapper>

                {/* Left/Right Prev/Next Buttons (Visible when not zoomed in) */}
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
              <div
                className='shrink-0 w-full z-30 text-white/80 px-3 sm:px-5 pt-2 bg-linear-to-t from-black/95 via-black/80 to-transparent border-t border-white/10'
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
              >
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 max-w-6xl mx-auto text-[11px] sm:text-xs font-mono leading-tight'>
                  {/* Camera & Lens Details */}
                  <div className='flex items-center gap-1.5 flex-wrap min-w-0'>
                    <IconCamera className='size-3.5 text-white/50 shrink-0' />
                    <span className='font-medium text-white truncate max-w-[200px] sm:max-w-none'>
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
                        <span className='text-white/80 truncate max-w-[180px] sm:max-w-none'>
                          {photos[lightboxIndex].lensModel}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Exposure Parameters */}
                  <div className='flex items-center gap-1.5 flex-wrap text-white/70'>
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
