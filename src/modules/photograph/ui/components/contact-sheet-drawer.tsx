'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { cn } from '@/lib/utils';
import { Photo } from '@/db/schema';

export type SessionContactPhoto = Photo & {
  frameNumber?: number | null;
  isInitialPick?: boolean | null;
  isRevisitedPick?: boolean | null;
  initialOrder?: number | null;
  revisitedOrder?: number | null;
};

interface ContactSheetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: SessionContactPhoto[];
  title?: string;
  onSelectPhoto: (photo: SessionContactPhoto, index: number) => void;
}

export const ContactSheetDrawer = ({
  open,
  onOpenChange,
  photos,
  title = 'Contact Sheet',
  onSelectPhoto,
}: ContactSheetDrawerProps) => {
  const totalFrames = photos.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl! w-[95vw]! max-h-[90vh]! h-[90vh]! p-0 overflow-hidden flex flex-col bg-zinc-950 text-zinc-100 border-zinc-800'>
        {/* Header */}
        <DialogHeader className='px-4 sm:px-6 py-4 border-b border-zinc-800 shrink-0 bg-zinc-950/90 backdrop-blur-md'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pr-8'>
            <div>
              <DialogTitle className='text-sm sm:text-base font-mono font-medium tracking-wide text-zinc-100 flex items-center gap-2'>
                <span>🎞 {title}</span>
                <span className='text-xs text-zinc-500 font-normal'>
                  ({totalFrames} Frames)
                </span>
              </DialogTitle>
            </div>

            {/* Historic Contact Sheet Marker Legend */}
            <div className='flex items-center gap-3 text-[11px] font-mono text-zinc-400'>
              <span className='inline-flex items-center gap-1.5'>
                <span className='size-2 rounded-full bg-amber-400' />
                <span>Initial Gut Pick</span>
              </span>
              <span className='inline-flex items-center gap-1.5'>
                <span className='size-2 rounded-full bg-red-500' />
                <span>Revisited Cut</span>
              </span>
              <span className='hidden sm:inline-flex items-center gap-1.5'>
                <span className='size-2 rounded-xs bg-red-500 ring-1 ring-amber-400' />
                <span>Both</span>
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Light-Table Contact Sheet Grid */}
        <div className='flex-1 overflow-y-auto p-3 sm:p-6 overscroll-contain'>
          <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3'>
            {photos.map((photo, index) => {
              const frameNum = photo.frameNumber ?? index + 1;
              const formattedFrame = String(frameNum).padStart(2, '0');
              const isInitial = Boolean(photo.isInitialPick);
              const isRevisited = Boolean(photo.isRevisitedPick);
              const isBoth = isInitial && isRevisited;

              return (
                <button
                  key={photo.id || index}
                  type='button'
                  onClick={() => {
                    onSelectPhoto(photo, index);
                  }}
                  className={cn(
                    'group relative aspect-[3/2] w-full overflow-hidden rounded-xs bg-zinc-900 border transition-all duration-200 cursor-pointer text-left',
                    isBoth
                      ? 'border-red-500 ring-2 ring-red-500 ring-offset-1 ring-offset-zinc-950'
                      : isRevisited
                        ? 'border-red-500/80 ring-2 ring-red-500/80 ring-offset-1 ring-offset-zinc-950'
                        : isInitial
                          ? 'border-amber-400/80 ring-2 ring-amber-400/80 ring-offset-1 ring-offset-zinc-950'
                          : 'border-zinc-800/80 hover:border-zinc-600',
                  )}
                >
                  {/* Thumbnail Image - Lightweight WebP via Cloudflare Loader */}
                  <Image
                    src={keyToUrl(photo.url)}
                    alt={photo.title || `Frame ${formattedFrame}`}
                    fill
                    sizes='(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw'
                    loading='lazy'
                    className='object-cover transition-transform duration-300 group-hover:scale-[1.03]'
                  />

                  {/* Dark Vignette Overlay for readability */}
                  <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 pointer-events-none' />

                  {/* Top-Right Historic Marker Badge */}
                  {isBoth ? (
                    <div className='absolute top-1 right-1 z-10 flex items-center gap-1 bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-xs shadow-xs'>
                      <span className='size-1.5 rounded-full bg-amber-300' />
                      <span>BOTH</span>
                    </div>
                  ) : isRevisited ? (
                    <div className='absolute top-1 right-1 z-10 bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-xs shadow-xs'>
                      REV
                    </div>
                  ) : isInitial ? (
                    <div className='absolute top-1 right-1 z-10 bg-amber-400 text-zinc-950 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-xs shadow-xs'>
                      1ST
                    </div>
                  ) : null}

                  {/* Bottom-Left Frame Index */}
                  <div className='absolute bottom-1 left-1.5 z-10 font-mono text-[10px] sm:text-xs font-semibold text-zinc-200 drop-shadow-md'>
                    {formattedFrame}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info bar */}
        <div className='px-4 sm:px-6 py-2.5 border-t border-zinc-800/80 bg-zinc-950/90 text-[11px] font-mono text-zinc-500 flex items-center justify-between'>
          <span>Tippe auf ein Bild für die Großansicht</span>
          <span className='hidden sm:inline'>Chronologische Reihenfolge</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
