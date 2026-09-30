'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  IconArrowsMaximize,
  IconCamera,
  IconShare,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconMessageCircle,
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

type StoryPhoto = Photo & { isHighlight?: boolean };

type EditorialBlock =
  | { type: 'hero'; photo: StoryPhoto; index: number }
  | { type: 'highlight'; photo: StoryPhoto; index: number }
  | { type: 'diptych'; photos: [StoryPhoto, StoryPhoto]; startIndex: number }
  | { type: 'landscape'; photo: StoryPhoto; index: number }
  | { type: 'solo'; photo: StoryPhoto; index: number };

// Deterministic seed based on string hash for layout variety and SSR consistency
function getPostSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getBlockSeed(postSeed: number, idx: number): number {
  let h = (postSeed ^ (idx * 0x5bd1e995)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

function getEditorialBlockId(block: EditorialBlock): string {
  if (block.type === 'diptych') {
    return `${block.photos[0].id}-${block.photos[1].id}`;
  }
  return block.photo.id;
}

export const EditorialStoryView = ({ post }: EditorialStoryViewProps) => {
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

  // Extract all photos sorted, preserving highlight flag
  const photos: StoryPhoto[] = useMemo(() => {
    if (post.postsToPhotos && post.postsToPhotos.length > 0) {
      return post.postsToPhotos.map((ptp) => ({
        ...ptp.photo,
        isHighlight: Boolean((ptp as { isHighlight?: boolean }).isHighlight),
      }));
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
          isHighlight: false,
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

  // Split single post content into paragraphs for dynamic story weaving
  const paragraphs: string[] = useMemo(() => {
    if (!post.content) return [];
    return post.content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [post.content]);

  const postSeed = useMemo(
    () => getPostSeed(post.id || post.slug),
    [post.id, post.slug],
  );

  // Intelligent Portrait-First Layout Engine:
  // - Hero: Opening plate (Photo 0) - Always commanding and solo
  // - Highlight: User-marked hero feature - Always solo, dominant presence (90vh)
  // - Landscape: Horizontal frames (aspect ratio >= 1.15) as cinematic breathers
  // - Solo: Standalone vertical plate (88vh) with balanced margins, carrying 70%+ of the essay
  // - Diptych: Rare, intentional pairing of vertical frames - NEVER consecutive, separated by solos
  const blocks: EditorialBlock[] = useMemo(() => {
    if (photos.length === 0) return [];
    if (photos.length === 1) {
      return [{ type: 'hero', photo: photos[0], index: 0 }];
    }

    const hero = photos[0];
    const remaining = photos.slice(1);
    const result: EditorialBlock[] = [{ type: 'hero', photo: hero, index: 0 }];

    let i = 0;
    let lastWasPair = false;
    let solosSinceLastPair = 2; // Allow natural pairing after initial solo frames

    while (i < remaining.length) {
      const current = remaining[i];
      const realIndex = i + 1;
      const ratio =
        current.aspectRatio ||
        (current.width && current.height ? current.width / current.height : 2 / 3);

      const isVertical = ratio < 1.15;
      const isLandscape = ratio >= 1.15;
      const isHighlight = Boolean(current.isHighlight);

      // Rule 1: User marked as Highlight -> Solo Feature Frame (Never paired)
      if (isHighlight) {
        result.push({
          type: 'highlight',
          photo: current,
          index: realIndex,
        });
        lastWasPair = false;
        solosSinceLastPair += 1;
        i += 1;
        continue;
      }

      // Rule 2: Landscape photo (Querformat) -> Cinematic Breather
      if (isLandscape) {
        result.push({
          type: 'landscape',
          photo: current,
          index: realIndex,
        });
        lastWasPair = false;
        solosSinceLastPair += 1;
        i += 1;
        continue;
      }

      // Rule 3: Vertical photo (Hochformat) -> Prioritize Big Solos, Diptychs as rare visual accents
      if (isVertical) {
        const next = remaining[i + 1];
        if (next) {
          const nextRatio =
            next.aspectRatio ||
            (next.width && next.height ? next.width / next.height : 2 / 3);
          const nextIsVertical = nextRatio < 1.15;
          const nextIsHighlight = Boolean(next.isHighlight);

          // Master Editorial Pacing Cadence:
          // 1. Strictly NEVER two diptychs in a row (!lastWasPair)
          // 2. Next must be vertical and NOT a highlight
          // 3. Must have had at least 2 big solo photos before considering a pair (solosSinceLastPair >= 2)
          // 4. Deterministic rhythmic check so pairs occur deliberately (~25-30% of vertical photos)
          const cadenceAllowsPair =
            !lastWasPair &&
            solosSinceLastPair >= 2 &&
            (postSeed + realIndex) % 3 === 0;

          if (nextIsVertical && !nextIsHighlight && cadenceAllowsPair) {
            result.push({
              type: 'diptych',
              photos: [current, next],
              startIndex: realIndex,
            });
            lastWasPair = true;
            solosSinceLastPair = 0;
            i += 2;
            continue;
          }
        }

        // Single vertical plate (Dominant, large scale with full visual gravitas)
        result.push({
          type: 'solo',
          photo: current,
          index: realIndex,
        });
        lastWasPair = false;
        solosSinceLastPair += 1;
        i += 1;
        continue;
      }

      // Fallback
      result.push({
        type: 'solo',
        photo: current,
        index: realIndex,
      });
      lastWasPair = false;
      solosSinceLastPair += 1;
      i += 1;
    }

    return result;
  }, [photos, postSeed]);

  // Randomize the mixing of sticky photo pinning and organic scroll reveal animations:
  // - Hero (block 0) pins in ~60% of posts that have multiple blocks
  // - Middle blocks (solo & occasional diptych) randomly and sparingly pin based on deterministic seed
  const stickyPinIndices = useMemo(() => {
    const pins = new Set<number>();
    if (blocks.length <= 1) return pins;

    // 1. Hero Block: randomized ~60% of multi-block posts
    if (postSeed % 5 < 3) {
      pins.add(0);
    }

    // 2. Middle blocks: sparingly and randomly pick candidates
    for (let i = 1; i < blocks.length - 1; i++) {
      // Don't pin if adjacent to another pin or within 1 block of a pin
      if (pins.has(i - 1) || pins.has(i - 2)) continue;

      const block = blocks[i];
      const bSeed = getBlockSeed(postSeed, i);

      // Solo & highlight feature frames: ~40% chance of sticky pinning
      if ((block.type === 'solo' || block.type === 'highlight') && bSeed % 10 < 4) {
        pins.add(i);
      }
      // Occasional diptych: ~20% chance of sticky pinning if followed by a solo/highlight frame
      else if (
        block.type === 'diptych' &&
        (blocks[i + 1]?.type === 'solo' || blocks[i + 1]?.type === 'highlight') &&
        bSeed % 10 < 2
      ) {
        pins.add(i);
      }
    }

    return pins;
  }, [blocks, postSeed]);

  type StoryUnit =
    | {
        type: 'pinned-hero-unit';
        heroBlock: EditorialBlock & { type: 'hero' };
        overlayBlock: EditorialBlock;
        fieldNote?: string;
      }
    | {
        type: 'pinned-unit';
        pinnedBlock: EditorialBlock;
        overlayBlock: EditorialBlock;
        fieldNote?: string;
      }
    | {
        type: 'standard-unit';
        block: EditorialBlock;
        fieldNote?: string;
      };

  const storyUnits = useMemo(() => {
    const rawUnits: Array<{
      type: 'pinned-hero-unit' | 'pinned-unit' | 'standard-unit';
      heroBlock?: EditorialBlock & { type: 'hero' };
      pinnedBlock?: EditorialBlock;
      overlayBlock?: EditorialBlock;
      block?: EditorialBlock;
      fieldNote?: string;
    }> = [];

    let i = 0;
    while (i < blocks.length) {
      if (i === 0 && blocks[0].type === 'hero') {
        if (stickyPinIndices.has(0) && blocks.length > 1) {
          rawUnits.push({
            type: 'pinned-hero-unit',
            heroBlock: blocks[0] as EditorialBlock & { type: 'hero' },
            overlayBlock: blocks[1],
          });
          i = 2;
        } else {
          rawUnits.push({
            type: 'standard-unit',
            block: blocks[0],
          });
          i = 1;
        }
      } else {
        if (stickyPinIndices.has(i) && i + 1 < blocks.length) {
          rawUnits.push({
            type: 'pinned-unit',
            pinnedBlock: blocks[i],
            overlayBlock: blocks[i + 1],
          });
          i += 2;
        } else {
          rawUnits.push({
            type: 'standard-unit',
            block: blocks[i],
          });
          i += 1;
        }
      }
    }

    // Dynamic Text Weaving: Distribute paragraphs across story units!
    if (paragraphs.length === 1) {
      if (rawUnits.length > 0) {
        rawUnits[0].fieldNote = paragraphs[0];
      }
    } else if (paragraphs.length > 1 && rawUnits.length > 0) {
      // Paragraph 0: Intro / Lead note after Hero
      rawUnits[0].fieldNote = paragraphs[0];

      const remainingPars = paragraphs.slice(1);
      const remainingUnitsCount = rawUnits.length - 1;

      if (remainingUnitsCount <= 0) {
        rawUnits[0].fieldNote = paragraphs.join('\n\n');
      } else {
        remainingPars.forEach((para, pIdx) => {
          const targetUnitIdx =
            1 +
            Math.min(
              remainingUnitsCount - 1,
              Math.floor((pIdx + 0.5) * (remainingUnitsCount / remainingPars.length)),
            );
          if (rawUnits[targetUnitIdx].fieldNote) {
            rawUnits[targetUnitIdx].fieldNote += `\n\n${para}`;
          } else {
            rawUnits[targetUnitIdx].fieldNote = para;
          }
        });
      }
    }

    return rawUnits as StoryUnit[];
  }, [blocks, stickyPinIndices, paragraphs]);

  const renderHeroContent = (block: EditorialBlock & { type: 'hero' }) => {
    const photo = block.photo;
    const ratio =
      photo.aspectRatio ||
      (photo.width && photo.height ? photo.width / photo.height : 3 / 2);

    return (
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
            className='w-full relative overflow-hidden bg-muted/10 group/photo select-none cursor-zoom-in transition-transform duration-500 ease-out hover:-translate-y-0.5'
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
              className='object-contain w-full h-full'
              priority={block.index === 0}
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px'
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
    );
  };

  const renderHighlightContent = (
    block: EditorialBlock & { type: 'highlight' },
  ) => {
    const photo = block.photo;
    const ratio =
      photo.aspectRatio ||
      (photo.width && photo.height ? photo.width / photo.height : 2 / 3);

    return (
      <div className='flex justify-center w-full max-w-6xl mx-auto py-6 sm:py-10'>
        <div
          className='group/plate flex flex-col items-end w-full'
          style={{
            width: `min(100%, calc(min(90vh, calc(100dvh - 4rem)) * ${ratio}))`,
            maxWidth: '100%',
          }}
        >
          <div
            onClick={() => setLightboxIndex(block.index)}
            className='w-full relative overflow-hidden bg-muted/10 group/photo select-none cursor-zoom-in transition-transform duration-500 ease-out hover:-translate-y-0.5'
            style={{
              aspectRatio: `${ratio}`,
              maxHeight: 'min(90vh, calc(100dvh - 4rem))',
            }}
          >
            <BlurImage
              src={keyToUrl(photo.url)}
              alt={photo.title || post.title}
              fill
              blurhash={photo.blurData}
              aspectRatio={ratio}
              className='object-contain w-full h-full'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 95vw, 1200px'
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

          {/* Understated Highlight Indicator */}
          <div className='pt-2 flex items-center justify-between w-full text-[10px] sm:text-[11px] font-mono tracking-widest text-muted-foreground/80 group-hover/plate:text-foreground transition-colors duration-300 select-none'>
            <span className='text-amber-500/90 font-medium tracking-wider'>★ HIGHLIGHT</span>
            <span>{String(block.index + 1).padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderLandscapeContent = (
    block: EditorialBlock & { type: 'landscape' },
  ) => {
    const photo = block.photo;
    const ratio =
      photo.aspectRatio ||
      (photo.width && photo.height ? photo.width / photo.height : 3 / 2);

    return (
      <div className='flex justify-center w-full max-w-5xl mx-auto py-2 sm:py-4'>
        <div
          className='group/plate flex flex-col items-end w-full'
          style={{
            maxWidth: '100%',
          }}
        >
          <div
            onClick={() => setLightboxIndex(block.index)}
            className='w-full relative overflow-hidden bg-muted/10 group/photo select-none cursor-zoom-in transition-transform duration-500 ease-out hover:-translate-y-0.5'
            style={{
              aspectRatio: `${ratio}`,
              maxHeight: 'min(82vh, calc(100dvh - 5.5rem))',
            }}
          >
            <BlurImage
              src={keyToUrl(photo.url)}
              alt={photo.title || post.title}
              fill
              blurhash={photo.blurData}
              aspectRatio={ratio}
              className='object-contain w-full h-full'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 95vw, 1100px'
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

          <div className='pt-2 text-[10px] sm:text-[11px] font-mono tracking-widest text-muted-foreground/80 group-hover/plate:text-foreground transition-colors duration-300 select-none'>
            <span>{String(block.index + 1).padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSoloContent = (block: EditorialBlock & { type: 'solo' }) => {
    const photo = block.photo;
    const ratio =
      photo.aspectRatio ||
      (photo.width && photo.height ? photo.width / photo.height : 3 / 2);

    // Dynamic desktop layout pacing:
    // Alternate alignment on large displays (centered, slightly left-biased, slightly right-biased)
    // to give the organic breathing rhythm of turning pages in a curated fine-art photo monograph.
    const layoutVariant = (postSeed + block.index) % 4;
    const alignmentClass =
      layoutVariant === 1
        ? 'justify-center lg:justify-start lg:pl-8 xl:pl-16'
        : layoutVariant === 3
          ? 'justify-center lg:justify-end lg:pr-8 xl:pr-16'
          : 'justify-center';

    return (
      <div className={cn('flex w-full max-w-6xl mx-auto py-2 sm:py-4', alignmentClass)}>
        <div
          className='group/plate flex flex-col items-end'
          style={{
            width: `min(100%, calc(min(88vh, calc(100dvh - 4.5rem)) * ${ratio}))`,
            maxWidth: '100%',
          }}
        >
          <div
            onClick={() => setLightboxIndex(block.index)}
            className='w-full relative overflow-hidden bg-muted/10 group/photo select-none cursor-zoom-in transition-transform duration-500 ease-out hover:-translate-y-0.5'
            style={{
              aspectRatio: `${ratio}`,
              maxHeight: 'min(88vh, calc(100dvh - 4.5rem))',
            }}
          >
            <BlurImage
              src={keyToUrl(photo.url)}
              alt={photo.title || post.title}
              fill
              blurhash={photo.blurData}
              aspectRatio={ratio}
              className='object-contain w-full h-full'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1100px'
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
    );
  };

  const renderDiptychContent = (
    block: EditorialBlock & { type: 'diptych' },
  ) => {
    const [photoA, photoB] = block.photos;
    const ratioA =
      photoA.aspectRatio ||
      (photoA.width && photoA.height ? photoA.width / photoA.height : 1);
    const ratioB =
      photoB.aspectRatio ||
      (photoB.width && photoB.height ? photoB.width / photoB.height : 1);

    const bSeed = getBlockSeed(postSeed, block.startIndex);
    const bothVertical = ratioA < 1.25 && ratioB < 1.25;
    const isMobileSideBySide = bothVertical
      ? bSeed % 3 !== 0 // ~66% of vertical pairs sit side-by-side on mobile
      : bSeed % 4 === 0; // ~25% of other pairs sit side-by-side on mobile

    return (
      <div
        className={cn(
          'flex items-center md:items-start justify-center w-full',
          isMobileSideBySide
            ? 'flex-row gap-2.5 sm:gap-4 md:gap-8 items-start'
            : 'flex-col md:flex-row gap-8',
        )}
      >
        {/* Photo A */}
        <div
          className={cn(
            'flex flex-col items-end group/plate',
            isMobileSideBySide
              ? 'flex-[var(--ratio-a)_1_0%]'
              : 'w-full md:w-auto md:flex-[var(--ratio-a)_1_0%]',
          )}
          style={
            {
              '--ratio-a': ratioA,
              maxWidth: isMobileSideBySide
                ? undefined
                : `min(100%, calc(min(82vh, calc(100dvh - 6rem)) * ${ratioA}))`,
            } as React.CSSProperties
          }
        >
          <div
            onClick={() => setLightboxIndex(block.startIndex)}
            className='w-full relative group/photo overflow-hidden bg-muted/10 select-none cursor-zoom-in transition-transform duration-500 ease-out hover:-translate-y-0.5'
            style={{
              aspectRatio: `${ratioA}`,
              maxHeight: isMobileSideBySide
                ? '70vh'
                : 'min(82vh, calc(100dvh - 6rem))',
            }}
          >
            <BlurImage
              src={keyToUrl(photoA.url)}
              alt={photoA.title || post.title}
              fill
              blurhash={photoA.blurData}
              aspectRatio={ratioA}
              className='object-contain w-full h-full'
              sizes={
                isMobileSideBySide
                  ? '(max-width: 768px) 50vw, 550px'
                  : '(max-width: 768px) 100vw, 550px'
              }
            />
            <div className='absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center gap-1.5 opacity-0 group-hover/photo:opacity-100 transition-opacity z-20'>
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
          <div className='pt-1.5 sm:pt-2 text-[10px] sm:text-[11px] font-mono tracking-widest text-muted-foreground/80 group-hover/plate:text-foreground transition-colors duration-300 select-none'>
            <span>{String(block.startIndex + 1).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Photo B */}
        <div
          className={cn(
            'flex flex-col items-end group/plate',
            isMobileSideBySide
              ? 'flex-[var(--ratio-b)_1_0%]'
              : 'w-full md:w-auto md:flex-[var(--ratio-b)_1_0%]',
          )}
          style={
            {
              '--ratio-b': ratioB,
              maxWidth: isMobileSideBySide
                ? undefined
                : `min(100%, calc(min(82vh, calc(100dvh - 6rem)) * ${ratioB}))`,
            } as React.CSSProperties
          }
        >
          <div
            onClick={() => setLightboxIndex(block.startIndex + 1)}
            className='w-full relative group/photo overflow-hidden bg-muted/10 select-none cursor-zoom-in transition-transform duration-500 ease-out hover:-translate-y-0.5'
            style={{
              aspectRatio: `${ratioB}`,
              maxHeight: isMobileSideBySide
                ? '70vh'
                : 'min(82vh, calc(100dvh - 6rem))',
            }}
          >
            <BlurImage
              src={keyToUrl(photoB.url)}
              alt={photoB.title || post.title}
              fill
              blurhash={photoB.blurData}
              aspectRatio={ratioB}
              className='object-contain w-full h-full'
              sizes={
                isMobileSideBySide
                  ? '(max-width: 768px) 50vw, 550px'
                  : '(max-width: 768px) 100vw, 550px'
              }
            />
            <div className='absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center gap-1.5 opacity-0 group-hover/photo:opacity-100 transition-opacity z-20'>
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
          <div className='pt-1.5 sm:pt-2 text-[10px] sm:text-[11px] font-mono tracking-widest text-muted-foreground/80 group-hover/plate:text-foreground transition-colors duration-300 select-none'>
            <span>{String(block.startIndex + 2).padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderBlockContent = (block: EditorialBlock) => {
    if (block.type === 'hero') return renderHeroContent(block);
    if (block.type === 'highlight') return renderHighlightContent(block);
    if (block.type === 'landscape') return renderLandscapeContent(block);
    if (block.type === 'solo') return renderSoloContent(block);
    if (block.type === 'diptych') return renderDiptychContent(block);
    return null;
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link in Zwischenablage kopiert');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const createSeriesPrintInquiryUrl = () => {
    const subject = encodeURIComponent(`Print-Anfrage: Serie „${post.title}“`);
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
    const timer = setTimeout(() => {
      setCurrentScale(1);
    }, 0);
    isPanningRef.current = false;
    ignoreClickRef.current = false;
    pointerDownPos.current = null;
    didMovePointer.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
    hasTouchMoved.current = false;
    return () => clearTimeout(timer);
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

          <h1 className='text-3xl sm:text-4xl lg:text-[2.75rem] font-serif tracking-tight text-foreground leading-[1.12] mb-4'>
            {post.title}
          </h1>
        </div>
      </header>

      {/* 2. EDITORIAL BUILDING BLOCKS ENGINE (Viewport-Fitted Zero-Crop with Mixed Sticky & Reveal) */}
      <div className='w-full'>
        {storyUnits.map((unit, unitIdx) => {
          if (unit.type === 'pinned-hero-unit') {
            return (
              <section
                key={`pinned-hero-${unit.heroBlock.photo.id}`}
                className='relative w-full'
              >
                {/* 1. HERO PINNED FRAME */}
                <div className='sticky top-14 md:top-20 z-0'>
                  {renderHeroContent(unit.heroBlock)}
                </div>

                {/* 2. OVERLAY CONTAINER (Field note if present + Next Block) */}
                <div className='relative z-10 bg-background -mx-3 px-3 md:mx-0 md:px-0 shadow-[0_-16px_32px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_-16px_32px_-12px_rgba(0,0,0,0.4)] mt-6 md:mt-10 pt-8 md:pt-14 pb-4'>
                  {unit.fieldNote && (
                    <div className='max-w-2xl mx-auto px-4 pb-12 md:pb-20'>
                      <div className='border-l-2 border-foreground/30 pl-6 py-2 my-2'>
                        <p className='font-serif text-lg sm:text-xl md:text-2xl leading-relaxed text-foreground/90 whitespace-pre-line italic'>
                          {unit.fieldNote}
                        </p>
                      </div>
                    </div>
                  )}

                  {renderBlockContent(unit.overlayBlock)}
                </div>
              </section>
            );
          }

          if (unit.type === 'pinned-unit') {
            const blockId = getEditorialBlockId(unit.pinnedBlock);

            return (
              <section
                key={`pinned-pair-${blockId}`}
                className='relative w-full mt-16 md:mt-28'
                style={
                  unitIdx > 0
                    ? {
                        contentVisibility: 'auto',
                        containIntrinsicSize: 'auto none auto 800px',
                      }
                    : undefined
                }
              >
                {/* 1. PINNED FRAME */}
                <div className='sticky top-14 md:top-20 z-0'>
                  {renderBlockContent(unit.pinnedBlock)}
                </div>

                {/* 2. OVERLAY FRAME */}
                <div className='relative z-10 bg-background -mx-3 px-3 md:mx-0 md:px-0 shadow-[0_-16px_32px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_-16px_32px_-12px_rgba(0,0,0,0.4)] mt-6 md:mt-10 pt-8 md:pt-14 pb-4'>
                  {unit.fieldNote && (
                    <div className='max-w-2xl mx-auto px-4 pb-10 md:pb-16'>
                      <div className='border-l-2 border-foreground/30 pl-6 py-2 my-2'>
                        <p className='font-serif text-lg sm:text-xl md:text-2xl leading-relaxed text-foreground/90 whitespace-pre-line italic'>
                          {unit.fieldNote}
                        </p>
                      </div>
                    </div>
                  )}
                  {renderBlockContent(unit.overlayBlock)}
                </div>
              </section>
            );
          }

          if (unit.type === 'standard-unit') {
            const block = unit.block;
            if (block.type === 'hero') {
              return (
                <section
                  key={`hero-${block.photo.id}`}
                  className='relative w-full'
                >
                  <ScrollReveal disabled>{renderHeroContent(block)}</ScrollReveal>

                  {unit.fieldNote && (
                    <div className='max-w-2xl mx-auto px-4 pt-8 md:pt-14'>
                      <ScrollReveal>
                        <div className='border-l-2 border-foreground/30 pl-6 py-2 my-2'>
                          <p className='font-serif text-lg sm:text-xl md:text-2xl leading-relaxed text-foreground/90 whitespace-pre-line italic'>
                            {unit.fieldNote}
                          </p>
                        </div>
                      </ScrollReveal>
                    </div>
                  )}
                </section>
              );
            }

            const blockId = getEditorialBlockId(block);

            return (
              <section
                key={`standard-${blockId}`}
                className='w-full mt-16 md:mt-28'
                style={
                  unitIdx > 0
                    ? {
                        contentVisibility: 'auto',
                        containIntrinsicSize: 'auto none auto 800px',
                      }
                    : undefined
                }
              >
                <ScrollReveal>{renderBlockContent(block)}</ScrollReveal>
                {unit.fieldNote && (
                  <div className='max-w-2xl mx-auto px-4 pt-10 md:pt-16'>
                    <ScrollReveal>
                      <div className='border-l-2 border-foreground/30 pl-6 py-2 my-2'>
                        <p className='font-serif text-lg sm:text-xl md:text-2xl leading-relaxed text-foreground/90 whitespace-pre-line italic'>
                          {unit.fieldNote}
                        </p>
                      </div>
                    </ScrollReveal>
                  </div>
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
        className='relative z-20 bg-background mt-14 md:mt-20 border-t border-border/60 pt-10 md:pt-14 space-y-12'
      >
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6'>
          <div className='w-full'>
            <Author size='md' />
            <p className='text-xs text-muted-foreground mt-1'>
              Dokumentation & Fotografie aus dem Alltag.
            </p>
          </div>
          <div className='w-full flex items-center gap-3 flex-wrap'>
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
            <a
              href={createSeriesPrintInquiryUrl()}
              className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background hover:bg-muted text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer'
            >
              <IconMail className='size-3.5 text-muted-foreground' />
              <span>Print zu dieser Serie anfragen</span>
            </a>
          </div>
        </div>

        {/* Curator's Guestbook (Gästebuch) */}
        <div className='bg-muted/30 border border-border/40 rounded-lg p-3 sm:p-4 md:p-6 max-w-3xl mx-auto'>
          <h3 className='text-lg font-medium tracking-tight mb-6 flex items-center gap-2'>
            <IconMessageCircle className='size-5 text-muted-foreground' />
            <span>Gästebuch der Serie</span>
          </h3>
          <SocialInteractions postId={post.id} variant='full' showActions={false} />
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
                style={{
                  paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))',
                }}
              >
                <div className='flex items-center gap-2 sm:gap-3 min-w-0'>
                  <span className='text-[11px] sm:text-xs font-mono tracking-widest uppercase bg-white/10 px-2 py-0.5 rounded-sm shrink-0'>
                    {String(lightboxIndex + 1).padStart(2, '0')} /{' '}
                    {String(photos.length).padStart(2, '0')}
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
                style={{
                  paddingBottom:
                    'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))',
                }}
              >
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 max-w-6xl mx-auto text-[11px] sm:text-xs font-mono leading-tight'>
                  {/* Camera & Lens Details */}
                  <div className='flex items-center gap-1.5 flex-wrap min-w-0'>
                    <IconCamera className='size-3.5 text-white/50 shrink-0' />
                    <span className='font-medium text-white truncate max-w-[200px] sm:max-w-none'>
                      {[
                        photos[lightboxIndex].make &&
                        photos[lightboxIndex].model
                          ? `${photos[lightboxIndex].make} ${photos[lightboxIndex].model}`
                          : photos[lightboxIndex].make ||
                            photos[lightboxIndex].model,
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
                          1/
                          {Math.round(1 / photos[lightboxIndex].exposureTime!)}s
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
