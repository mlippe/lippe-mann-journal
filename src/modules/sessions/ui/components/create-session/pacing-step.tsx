'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SessionPhotoDraft } from './types';
import {
  IconArrowUp,
  IconArrowDown,
  IconSparkles,
  IconColumns,
  IconSquare,
  IconArrowLeft,
  IconArrowRight,
} from '@tabler/icons-react';

interface PacingStepProps {
  photos: SessionPhotoDraft[];
  onUpdatePhoto: (photoId: string, updates: Partial<SessionPhotoDraft>) => void;
  onReorderPicks: (newOrderedPickedIds: string[]) => void;
  onProceed: () => void;
  onBack: () => void;
  uploadProgressText?: string;
}

export const PacingStep = ({
  photos,
  onUpdatePhoto,
  onReorderPicks,
  onProceed,
  onBack,
  uploadProgressText,
}: PacingStepProps) => {
  // Extract strictly the picked photos sorted by initialOrder
  const pickedPhotos = useMemo(() => {
    return photos
      .filter((p) => p.isInitialPick)
      .sort((a, b) => (a.initialOrder ?? 0) - (b.initialOrder ?? 0));
  }, [photos]);

  const moveItem = (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= pickedPhotos.length) return;

    const newOrder = [...pickedPhotos];
    const [moved] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    onReorderPicks(newOrder.map((p) => p.id));
  };

  const setSolo = (photo: SessionPhotoDraft, index: number) => {
    onUpdatePhoto(photo.id, { layoutPosition: 'solo', isHighlight: false });

    // If paired with next, reset next
    const next = pickedPhotos[index + 1];
    if (next && next.layoutPosition === 'right') {
      onUpdatePhoto(next.id, { layoutPosition: 'solo' });
    }
    // If was right partner of previous, reset previous
    const prev = pickedPhotos[index - 1];
    if (prev && prev.layoutPosition === 'left') {
      onUpdatePhoto(prev.id, { layoutPosition: 'solo' });
    }
  };

  const setHero = (photo: SessionPhotoDraft, index: number) => {
    onUpdatePhoto(photo.id, { layoutPosition: 'solo', isHighlight: true });

    // Break any pairing
    const next = pickedPhotos[index + 1];
    if (next && next.layoutPosition === 'right') {
      onUpdatePhoto(next.id, { layoutPosition: 'solo' });
    }
    const prev = pickedPhotos[index - 1];
    if (prev && prev.layoutPosition === 'left') {
      onUpdatePhoto(prev.id, { layoutPosition: 'solo' });
    }
  };

  const toggleDiptychPair = (photo: SessionPhotoDraft, index: number) => {
    // If currently left or right, reset both to solo
    if (photo.layoutPosition === 'left') {
      onUpdatePhoto(photo.id, { layoutPosition: 'solo' });
      const next = pickedPhotos[index + 1];
      if (next) onUpdatePhoto(next.id, { layoutPosition: 'solo' });
      return;
    }

    if (photo.layoutPosition === 'right') {
      onUpdatePhoto(photo.id, { layoutPosition: 'solo' });
      const prev = pickedPhotos[index - 1];
      if (prev) onUpdatePhoto(prev.id, { layoutPosition: 'solo' });
      return;
    }

    // Try to pair with next item
    const next = pickedPhotos[index + 1];
    if (next) {
      onUpdatePhoto(photo.id, { layoutPosition: 'left', isHighlight: false });
      onUpdatePhoto(next.id, { layoutPosition: 'right', isHighlight: false });
    }
  };

  return (
    <div className='w-full pb-24 space-y-6 max-w-2xl mx-auto'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4'>
        <div>
          <h2 className='text-xl sm:text-2xl font-bold tracking-tight'>
            Story Pacing · Curated Selection
          </h2>
          <p className='text-xs sm:text-sm text-muted-foreground mt-0.5'>
            Arrangiere deine {pickedPhotos.length} ausgewählten Frames. Bestimme Reihenfolge und Rhythmus.
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
            Auswahl anpassen
          </Button>
        </div>
      </div>

      {/* Selected Items List */}
      <div className='space-y-3'>
        {pickedPhotos.map((photo, index) => {
          const formattedFrame = String(photo.frameNumber).padStart(2, '0');
          const isHero = photo.isHighlight;
          const isLeft = photo.layoutPosition === 'left';
          const isRight = photo.layoutPosition === 'right';
          const isPaired = isLeft || isRight;
          const canPairWithNext = index < pickedPhotos.length - 1;

          return (
            <div
              key={photo.id}
              className={cn(
                'flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border bg-card transition-all',
                isHero
                  ? 'border-foreground/50 ring-1 ring-foreground/20 bg-muted/20'
                  : isPaired
                    ? 'border-primary/60 ring-1 ring-primary/20'
                    : 'border-border/80',
              )}
            >
              {/* Order badge & Thumbnail */}
              <div className='flex items-center gap-3'>
                <span className='font-mono font-bold text-xs size-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-foreground'>
                  {index + 1}
                </span>

                <div className='relative w-20 h-14 sm:w-24 sm:h-16 rounded-md overflow-hidden bg-black/10 shrink-0 border border-border/60'>
                  <Image
                    src={photo.previewUrl}
                    alt={photo.title}
                    fill
                    sizes='96px'
                    className='object-cover'
                    unoptimized
                  />
                  <span className='absolute bottom-1 left-1 bg-black/70 text-white font-mono text-[9px] px-1 rounded-xs'>
                    {formattedFrame}
                  </span>
                </div>

                <div className='flex-1 min-w-0 sm:hidden'>
                  <p className='text-xs font-mono font-semibold truncate'>
                    Frame {formattedFrame}
                  </p>
                  <p className='text-[11px] text-muted-foreground'>
                    {isHero
                      ? 'Hero / Highlight'
                      : isLeft
                        ? 'Diptych (Links)'
                        : isRight
                          ? 'Diptych (Rechts)'
                          : 'Solo Frame'}
                  </p>
                </div>
              </div>

              {/* Middle Info / Pacing details on Desktop */}
              <div className='hidden sm:flex flex-col flex-1 min-w-0'>
                <span className='text-xs font-mono font-semibold truncate'>
                  Frame {formattedFrame}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {isHero
                    ? '★ Großes Highlight Feature'
                    : isLeft
                      ? '◫ Diptych Paar (Linke Seite)'
                      : isRight
                        ? '◫ Diptych Paar (Rechte Seite)'
                        : '◻ Ruhiges Solo Bild'}
                </span>
              </div>

              {/* Action Controls */}
              <div className='flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40'>
                {/* Layout Type Pills */}
                <div className='flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg text-xs'>
                  <button
                    type='button'
                    onClick={() => setSolo(photo, index)}
                    className={cn(
                      'px-2 py-1 rounded-md transition-all flex items-center gap-1 text-[11px]',
                      !isHero && !isPaired
                        ? 'bg-background shadow-xs font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    title='Solo Standard'
                  >
                    <IconSquare className='size-3.5' />
                    <span className='hidden sm:inline'>Solo</span>
                  </button>

                  <button
                    type='button'
                    onClick={() => setHero(photo, index)}
                    className={cn(
                      'px-2 py-1 rounded-md transition-all flex items-center gap-1 text-[11px]',
                      isHero
                        ? 'bg-foreground text-background font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    title='Hero Feature'
                  >
                    <IconSparkles className='size-3.5' />
                    <span className='hidden sm:inline'>Hero</span>
                  </button>

                  <button
                    type='button'
                    onClick={() => toggleDiptychPair(photo, index)}
                    disabled={!isPaired && !canPairWithNext}
                    className={cn(
                      'px-2 py-1 rounded-md transition-all flex items-center gap-1 text-[11px] disabled:opacity-30',
                      isPaired
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    title={isPaired ? 'Paar trennen' : 'Mit nächstem Bild koppeln'}
                  >
                    <IconColumns className='size-3.5' />
                    <span className='hidden sm:inline'>
                      {isLeft ? 'Diptych L' : isRight ? 'Diptych R' : 'Paaren'}
                    </span>
                  </button>
                </div>

                {/* Move Up / Down Buttons */}
                <div className='flex items-center gap-0.5'>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    className='size-7'
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    aria-label='Nach oben'
                  >
                    <IconArrowUp className='size-3.5' />
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    className='size-7'
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === pickedPhotos.length - 1}
                    aria-label='Nach unten'
                  >
                    <IconArrowDown className='size-3.5' />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Bar */}
      <div className='fixed bottom-6 inset-x-0 px-4 flex justify-center z-40 pointer-events-none'>
        <div className='pointer-events-auto flex items-center gap-3 bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-full px-5 py-3 shadow-2xl backdrop-blur-md text-xs sm:text-sm font-mono'>
          <span>
            Pacing bereit (<strong>{pickedPhotos.length}</strong> Frames)
          </span>
          <Button
            size='sm'
            onClick={onProceed}
            className='bg-white text-zinc-950 hover:bg-zinc-200 font-semibold rounded-full px-4 h-8 text-xs cursor-pointer'
          >
            <span>Dispatch & Veröffentlichen</span>
            <IconArrowRight className='size-3.5 ml-1' />
          </Button>
        </div>
      </div>
    </div>
  );
};
