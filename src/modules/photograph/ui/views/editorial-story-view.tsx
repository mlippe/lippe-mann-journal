'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  const [copied, setCopied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

      // When 4 or more photos remain, and in rhythmic cadence, insert a contact strip
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

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % photos.length : null,
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev - 1 + photos.length) % photos.length : null,
        );
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
      }
    },
    [lightboxIndex, photos.length],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const formattedDate = useMemo(() => {
    if (!post.createdAt) return '';
    return format(new Date(post.createdAt), 'dd. MMMM yyyy', { locale: de });
  }, [post.createdAt]);

  const collections = post.postsToCollections?.map((ptc) => ptc.collection) || [];

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
              href='#discussion'
              className='inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors'
            >
              <IconMessageCircle className='size-3.5' />
              <span>Kommentare</span>
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

      {/* 2. EDITORIAL BUILDING BLOCKS ENGINE */}
      <div className='space-y-12 md:space-y-20'>
        {blocks.map((block, bIdx) => {
          /* ─────────────────────────────────────────────────────────────
           * BUILDING BLOCK 1: [ HERO BLEED ]
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
                <div
                  className='relative w-full overflow-hidden bg-muted/20 border border-border/40 group'
                  style={{ aspectRatio: `${ratio}` }}
                >
                  <BlurImage
                    src={keyToUrl(photo.url)}
                    alt={photo.title || post.title}
                    width={photo.width}
                    height={photo.height}
                    blurhash={photo.blurData}
                    aspectRatio={ratio}
                    className='object-contain w-full h-full'
                    priority
                    sizes='(max-width: 1024px) 100vw, 1200px'
                  />

                  {/* Fullscreen Inspector Button */}
                  <button
                    onClick={() => setLightboxIndex(block.index)}
                    className='absolute top-3 right-3 p-2 rounded-full bg-background/70 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background text-foreground shadow-sm cursor-pointer'
                    aria-label='Foto vergrößern'
                  >
                    <IconArrowsMaximize className='size-4' />
                  </button>

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
           * height without a single pixel cropped!
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
                <div className='flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-8 w-full'>
                  {/* Photo A */}
                  <div
                    className='w-full md:w-auto relative group overflow-hidden bg-muted/20 border border-border/40'
                    style={{ flex: `${ratioA} 1 0%` }}
                  >
                    <div
                      style={{ aspectRatio: `${ratioA}` }}
                      className='relative w-full'
                    >
                      <BlurImage
                        src={keyToUrl(photoA.url)}
                        alt={photoA.title || post.title}
                        width={photoA.width}
                        height={photoA.height}
                        blurhash={photoA.blurData}
                        aspectRatio={ratioA}
                        className='object-contain w-full h-full'
                        sizes='(max-width: 768px) 100vw, 50vw'
                      />
                      <button
                        onClick={() => setLightboxIndex(block.startIndex)}
                        className='absolute top-3 right-3 p-1.5 rounded-full bg-background/70 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background text-foreground shadow-sm cursor-pointer'
                        aria-label='Foto vergrößern'
                      >
                        <IconArrowsMaximize className='size-3.5' />
                      </button>
                    </div>
                  </div>

                  {/* Photo B */}
                  <div
                    className='w-full md:w-auto relative group overflow-hidden bg-muted/20 border border-border/40'
                    style={{ flex: `${ratioB} 1 0%` }}
                  >
                    <div
                      style={{ aspectRatio: `${ratioB}` }}
                      className='relative w-full'
                    >
                      <BlurImage
                        src={keyToUrl(photoB.url)}
                        alt={photoB.title || post.title}
                        width={photoB.width}
                        height={photoB.height}
                        blurhash={photoB.blurData}
                        aspectRatio={ratioB}
                        className='object-contain w-full h-full'
                        sizes='(max-width: 768px) 100vw, 50vw'
                      />
                      <button
                        onClick={() => setLightboxIndex(block.startIndex + 1)}
                        className='absolute top-3 right-3 p-1.5 rounded-full bg-background/70 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background text-foreground shadow-sm cursor-pointer'
                        aria-label='Foto vergrößern'
                      >
                        <IconArrowsMaximize className='size-3.5' />
                      </button>
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
                          className='relative overflow-hidden bg-muted/20 border border-border/40 group'
                          style={{ aspectRatio: `${ratio}` }}
                        >
                          <BlurImage
                            src={keyToUrl(photo.url)}
                            alt={photo.title || `Frame #${actualIndex + 1}`}
                            width={photo.width}
                            height={photo.height}
                            blurhash={photo.blurData}
                            aspectRatio={ratio}
                            className='object-contain w-full h-full'
                            sizes='(max-width: 768px) 80vw, 300px'
                          />
                          <button
                            onClick={() => setLightboxIndex(actualIndex)}
                            className='absolute top-2 right-2 p-1.5 rounded-full bg-background/70 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background text-foreground shadow-sm cursor-pointer'
                            aria-label='Foto vergrößern'
                          >
                            <IconArrowsMaximize className='size-3.5' />
                          </button>
                        </div>
                        <div className='flex items-center justify-between text-[10px] font-mono text-muted-foreground'>
                          <span>[{String(actualIndex + 1).padStart(2, '0')}]</span>
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
           * Breathing room / detail highlight
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
                <div
                  className='relative w-full overflow-hidden bg-muted/20 border border-border/40 group'
                  style={{ aspectRatio: `${ratio}` }}
                >
                  <BlurImage
                    src={keyToUrl(photo.url)}
                    alt={photo.title || post.title}
                    width={photo.width}
                    height={photo.height}
                    blurhash={photo.blurData}
                    aspectRatio={ratio}
                    className='object-contain w-full h-full'
                    sizes='(max-width: 1024px) 100vw, 900px'
                  />
                  <button
                    onClick={() => setLightboxIndex(block.index)}
                    className='absolute top-3 right-3 p-1.5 rounded-full bg-background/70 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background text-foreground shadow-sm cursor-pointer'
                    aria-label='Foto vergrößern'
                  >
                    <IconArrowsMaximize className='size-3.5' />
                  </button>
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

      {/* 3. EDITORIAL FOOTER & SOCIAL INTERACTIONS */}
      <footer id='discussion' className='mt-20 md:mt-28 border-t border-border/60 pt-10 md:pt-14 space-y-12'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6'>
          <div>
            <Author size='md' />
            <p className='text-xs text-muted-foreground mt-1'>
              Dokumentation & Fotografie aus dem Alltag.
            </p>
          </div>
          <button
            onClick={handleShare}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background hover:bg-muted text-xs font-mono uppercase tracking-wider transition-colors w-fit cursor-pointer'
          >
            {copied ? (
              <>
                <IconCheck className='size-4 text-emerald-500' />
                <span className='text-emerald-500'>Link kopiert</span>
              </>
            ) : (
              <>
                <IconShare className='size-4' />
                <span>Story teilen</span>
              </>
            )}
          </button>
        </div>

        {/* Discussion / Comments / Likes Area */}
        <div className='bg-muted/30 border border-border/40 rounded-lg p-4 sm:p-6 md:p-8 max-w-3xl mx-auto'>
          <h3 className='text-lg font-medium tracking-tight mb-6 flex items-center gap-2'>
            <IconMessageCircle className='size-5 text-muted-foreground' />
            <span>Reaktionen & Gedanken</span>
          </h3>
          <SocialInteractions postId={post.id} variant='full' />
        </div>
      </footer>

      {/* 4. FULLSCREEN LIGHTBOX DIALOG */}
      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => {
          if (!open) setLightboxIndex(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className='bg-black/95 border-none max-w-screen! w-screen! h-screen! max-h-screen! p-0 m-0 rounded-none flex flex-col justify-between z-50 text-white'
        >
          <DialogTitle className='sr-only'>Foto Großansicht</DialogTitle>

          {lightboxIndex !== null && photos[lightboxIndex] && (
            <div className='relative w-full h-full flex flex-col justify-between p-4 sm:p-6 select-none'>
              {/* Top Controls */}
              <div className='flex items-center justify-between z-20 text-white/80'>
                <span className='text-xs font-mono tracking-widest uppercase'>
                  {lightboxIndex + 1} / {photos.length}
                </span>
                <button
                  onClick={() => setLightboxIndex(null)}
                  className='p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer'
                  aria-label='Schließen'
                >
                  <IconX className='size-5' />
                </button>
              </div>

              {/* Main Image View (100% Native Aspect Ratio Guarantee) */}
              <div className='relative grow flex items-center justify-center min-h-0 py-2'>
                <BlurImage
                  src={keyToUrl(photos[lightboxIndex].url)}
                  alt={photos[lightboxIndex].title || post.title}
                  width={photos[lightboxIndex].width}
                  height={photos[lightboxIndex].height}
                  blurhash={photos[lightboxIndex].blurData}
                  aspectRatio={photos[lightboxIndex].aspectRatio}
                  className='max-w-full max-h-full object-contain'
                  sizes='100vw'
                  priority
                />

                {/* Left/Right Prev/Next Buttons */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setLightboxIndex(
                          (lightboxIndex - 1 + photos.length) % photos.length,
                        )
                      }
                      className='absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white transition-colors cursor-pointer'
                      aria-label='Vorheriges Foto'
                    >
                      <IconChevronLeft className='size-6' />
                    </button>
                    <button
                      onClick={() =>
                        setLightboxIndex((lightboxIndex + 1) % photos.length)
                      }
                      className='absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white transition-colors cursor-pointer'
                      aria-label='Nächstes Foto'
                    >
                      <IconChevronRight className='size-6' />
                    </button>
                  </>
                )}
              </div>

              {/* Bottom Technical Caption */}
              <div className='flex items-center justify-between text-xs font-mono text-white/70 z-20 pt-2'>
                <span>
                  {photos[lightboxIndex].title || `Aufnahme #${lightboxIndex + 1}`}
                </span>
                <span>
                  {[
                    photos[lightboxIndex].make && photos[lightboxIndex].model
                      ? `${photos[lightboxIndex].make} ${photos[lightboxIndex].model}`
                      : photos[lightboxIndex].make,
                    photos[lightboxIndex].lensModel,
                    photos[lightboxIndex].focalLength
                      ? `${photos[lightboxIndex].focalLength}mm`
                      : null,
                    photos[lightboxIndex].fNumber
                      ? `f/${photos[lightboxIndex].fNumber}`
                      : null,
                    photos[lightboxIndex].exposureTime
                      ? `1/${Math.round(1 / photos[lightboxIndex].exposureTime!)}s`
                      : null,
                    photos[lightboxIndex].iso
                      ? `ISO ${photos[lightboxIndex].iso}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </article>
  );
};
