'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { SessionPhotoDraft } from './types';
import { IconZoomIn, IconArrowRight, IconArrowLeft } from '@tabler/icons-react';

interface GridStepProps {
  photos: SessionPhotoDraft[];
  onTogglePick: (photoId: string) => void;
  onProceed: () => void;
  onBack: () => void;
  uploadProgressText?: string;
}

export const GridStep = ({
  photos,
  onTogglePick,
  onProceed,
  onBack,
  uploadProgressText,
}: GridStepProps) => {
  const [previewPhoto, setPreviewPhoto] = useState<SessionPhotoDraft | null>(
    null,
  );

  const selectedCount = photos.filter((p) => p.isInitialPick).length;

  return (
    <div className='w-full pb-24 space-y-6'>
      {/* Step Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4'>
        <div>
          <h2 className='text-xl sm:text-2xl font-bold tracking-tight'>
            Pocket Light Table · Initial Selection
          </h2>
          <p className='text-xs sm:text-sm text-muted-foreground mt-0.5'>
            Wähle deine Favoriten direkt nach dem Shooting (3–7 Frames empfohlen).
          </p>
        </div>

        <div className='flex items-center gap-2 text-xs font-mono text-muted-foreground'>
          {uploadProgressText && (
            <span className='px-2.5 py-1 rounded-full bg-muted border border-border text-[11px] animate-pulse'>
              {uploadProgressText}
            </span>
          )}
          <Button variant='ghost' size='sm' onClick={onBack}>
            <IconArrowLeft className='size-4 mr-1' />
            Neu einlesen
          </Button>
        </div>
      </div>

      {/* Historic Yellow Marker Legend */}
      <div className='flex items-center justify-between text-xs font-mono text-muted-foreground px-1'>
        <div className='flex items-center gap-2'>
          <span className='size-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30' />
          <span>Gelber Marker = Initial Gut Pick</span>
        </div>
        <span className='tabular-nums font-medium text-foreground'>
          {selectedCount} von {photos.length} ausgewählt
        </span>
      </div>

      {/* 3-Column Mobile / 6-Column Desktop Grid */}
      <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3'>
        {photos.map((photo) => {
          const formattedFrame = String(photo.frameNumber).padStart(2, '0');
          const isSelected = photo.isInitialPick;
          const pickIndex = photo.initialOrder;

          return (
            <div
              key={photo.id}
              className={cn(
                'group relative aspect-[3/2] w-full overflow-hidden rounded-xs bg-muted border transition-all duration-200 select-none cursor-pointer',
                isSelected
                  ? 'border-amber-400 ring-2 ring-amber-400 ring-offset-2 ring-offset-background shadow-md'
                  : 'border-border/80 hover:border-foreground/40',
              )}
              onClick={() => onTogglePick(photo.id)}
            >
              {/* Thumbnail Image */}
              <Image
                src={photo.previewUrl}
                alt={photo.title}
                fill
                sizes='(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw'
                className='object-cover'
                unoptimized
              />

              {/* Gradient Scrim */}
              <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none' />

              {/* Top-Right Yellow Marker Badge */}
              {isSelected ? (
                <div className='absolute top-1 right-1 z-10 bg-amber-400 text-zinc-950 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs shadow-xs'>
                  ✓ {pickIndex !== null ? pickIndex + 1 : ''}
                </div>
              ) : null}

              {/* Bottom-Left Frame Index */}
              <div className='absolute bottom-1 left-1.5 z-10 font-mono text-[10px] sm:text-xs font-semibold text-white drop-shadow-md'>
                {formattedFrame}
              </div>

              {/* Zoom Preview Button */}
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewPhoto(photo);
                }}
                className='absolute top-1 left-1 z-10 p-1 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity'
                aria-label='Großansicht'
              >
                <IconZoomIn className='size-3.5' />
              </button>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Sticky Bar */}
      <div className='fixed bottom-6 inset-x-0 px-4 flex justify-center z-40 pointer-events-none'>
        <div className='pointer-events-auto flex items-center gap-3 bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-full px-5 py-3 shadow-2xl backdrop-blur-md text-xs sm:text-sm font-mono'>
          <span className='tabular-nums'>
            <strong className='text-amber-400'>{selectedCount}</strong> Frames ausgewählt
          </span>
          <Button
            size='sm'
            onClick={onProceed}
            disabled={selectedCount === 0}
            className='bg-amber-400 hover:bg-amber-500 text-zinc-950 font-semibold rounded-full px-4 h-8 text-xs cursor-pointer'
          >
            <span>Story-Pacing</span>
            <IconArrowRight className='size-3.5 ml-1' />
          </Button>
        </div>
      </div>

      {/* Fullscreen Quick Loupe Modal */}
      <Dialog
        open={previewPhoto !== null}
        onOpenChange={(open) => !open && setPreviewPhoto(null)}
      >
        <DialogContent className='max-w-4xl p-1 bg-black text-white border-zinc-800 overflow-hidden'>
          <DialogTitle className='sr-only'>Vorschau</DialogTitle>
          {previewPhoto && (
            <div className='relative w-full aspect-[3/2] max-h-[80vh] flex items-center justify-center'>
              <Image
                src={previewPhoto.previewUrl}
                alt={previewPhoto.title}
                fill
                className='object-contain'
                unoptimized
              />
              <div className='absolute bottom-3 left-3 bg-black/70 px-3 py-1 rounded text-xs font-mono text-zinc-200'>
                Frame {String(previewPhoto.frameNumber).padStart(2, '0')} · {previewPhoto.title}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
