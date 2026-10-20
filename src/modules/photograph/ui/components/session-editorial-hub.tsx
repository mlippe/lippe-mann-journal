'use client';

import { cn } from '@/lib/utils';
import { IconLayoutGrid, IconArrowUpRight, IconArrowUp } from '@tabler/icons-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Image from 'next/image';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { type SessionContactPhoto } from './contact-sheet-drawer';

interface SessionEditorialHubProps {
  activeCut: 'revisited' | 'initial';
  onCutChange: (cut: 'revisited' | 'initial') => void;
  hasRevisitedCut: boolean;
  initialCount: number;
  revisitedCount: number;
  allSessionPhotos: SessionContactPhoto[];
  revisitedNote?: string | null;
  revisitedAt?: string | Date | null;
  onOpenContactSheet: () => void;
  className?: string;
}

export const SessionEditorialHub = ({
  activeCut,
  onCutChange,
  hasRevisitedCut,
  initialCount,
  revisitedCount,
  allSessionPhotos,
  revisitedNote,
  revisitedAt,
  onOpenContactSheet,
  className,
}: SessionEditorialHubProps) => {
  const totalFrames = allSessionPhotos.length;

  const handleSwitchAndScroll = (targetCut: 'revisited' | 'initial') => {
    onCutChange(targetCut);
    const target = document.getElementById('story-photos');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className={cn('relative z-10', className)}>
      <div className='rounded-2xl border border-border/50 bg-muted/15 overflow-hidden transition-all duration-300'>
        {/* Upper: Editorial Selection Context, "Du siehst gerade" Statement & Author Rationale */}
        <div className='p-5 sm:p-7 md:p-8 border-b border-border/40 space-y-4'>
          {/* Header row: Session-Kuration & Frames */}
          <div className='flex items-center gap-2'>
            <span className='text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground/80 font-semibold'>
              Session-Kuration
            </span>
            <span className='text-muted-foreground/30'>·</span>
            <span className='text-[11px] sm:text-xs font-mono text-muted-foreground'>
              {totalFrames} Frames gesamt
            </span>
          </div>

          {/* "DU SIEHST GERADE" Indicator & Explanatory Quote */}
          <div className='space-y-1.5'>
            <div className='flex items-center gap-2'>
              <span className='text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-foreground/90 bg-muted/70 px-2 py-0.5 rounded-xs'>
                Du siehst gerade
              </span>
              {hasRevisitedCut && (
                <span className='text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider'>
                  {activeCut === 'revisited' ? 'Finale Wahl' : 'Erstwahl'}
                </span>
              )}
            </div>

            <p className='text-sm sm:text-[15px] text-muted-foreground font-sans leading-relaxed'>
              {hasRevisitedCut && activeCut === 'revisited'
                ? `Mit zeitlichem Abstand neu kuratierte Serie aus allen ${totalFrames} Frames dieser Session.`
                : `Die ursprüngliche Auswahl direkt nach dem Shooting – intuitiv getroffen aus allen ${totalFrames} Frames.`}
            </p>
          </div>

          {/* Author's Rationale Note when Finale Wahl is active */}
          {hasRevisitedCut && activeCut === 'revisited' && revisitedNote && (
            <div className='pt-1'>
              <div className='border-l-2 border-foreground/30 pl-3.5 sm:pl-4 py-1 bg-muted/20 rounded-r-md'>
                <p className='text-xs sm:text-sm italic font-sans text-foreground/85 leading-relaxed'>
                  &bdquo;{revisitedNote}&ldquo;
                </p>
                {revisitedAt && (
                  <span className='block text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60 mt-1.5'>
                    Notiz zur Finalen Wahl · {format(new Date(revisitedAt), 'MMMM yyyy', { locale: de })}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* CTA Switch Button below reading flow */}
          {hasRevisitedCut && (
            <div className='pt-1'>
              <button
                type='button'
                onClick={() =>
                  handleSwitchAndScroll(
                    activeCut === 'revisited' ? 'initial' : 'revisited',
                  )
                }
                className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-muted/80 hover:bg-muted text-foreground border border-border/70 hover:border-border text-xs font-mono transition-all duration-200 cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95'
              >
                <span>
                  {activeCut === 'revisited'
                    ? 'Originale Auswahl ansehen'
                    : 'Finale Wahl ansehen'}
                </span>
                <span className='text-[10px] text-muted-foreground font-normal tabular-nums'>
                  ({activeCut === 'revisited' ? initialCount : revisitedCount})
                </span>
                <IconArrowUp className='size-3 text-muted-foreground' />
              </button>
            </div>
          )}
        </div>

        {/* Lower: Visual Kontaktbogen Preview Grid with Gradient Fadeout & CTA */}
        <div
          onClick={onOpenContactSheet}
          className='group relative p-4 sm:p-6 hover:bg-muted/20 transition-colors cursor-pointer select-none'
        >
          {/* Header inside preview */}
          <div className='flex items-center justify-between mb-3 px-1'>
            <div className='flex items-center gap-2 text-xs font-mono tracking-wider text-muted-foreground uppercase'>
              <IconLayoutGrid className='size-3.5 text-muted-foreground' />
              <span>Kontaktbogen</span>
            </div>
            <span className='text-[11px] font-mono text-muted-foreground/60 hidden sm:inline'>
              Vollständigen Bogen öffnen ↗
            </span>
          </div>

          {/* Thumbnail Grid with gradient fadeout */}
          <div className='relative max-h-52 sm:max-h-60 overflow-hidden rounded-xl'>
            <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5 sm:gap-2 opacity-85 group-hover:opacity-100 transition-opacity'>
              {allSessionPhotos.map((photo, idx) => {
                const frameNum = photo.frameNumber ?? idx + 1;
                const formattedFrame = String(frameNum).padStart(2, '0');
                const isInitial = Boolean(photo.isInitialPick);
                const isRevisited = Boolean(photo.isRevisitedPick);
                const isBoth = isInitial && isRevisited;

                return (
                  <div
                    key={photo.id || idx}
                    className={cn(
                      'relative aspect-[3/2] rounded-xs overflow-hidden bg-muted/50 border transition-all',
                      isBoth
                        ? 'border-amber-400/80 ring-1 ring-red-500/80'
                        : isRevisited
                          ? 'border-red-500/70 ring-1 ring-red-500/70'
                          : isInitial
                            ? 'border-amber-400/70 ring-1 ring-amber-400/70'
                            : 'border-border/40',
                    )}
                  >
                    <Image
                      src={keyToUrl(photo.url)}
                      alt={photo.title || `Frame ${formattedFrame}`}
                      fill
                      sizes='(max-width: 640px) 25vw, (max-width: 1024px) 15vw, 10vw'
                      className='object-cover'
                      loading='lazy'
                    />
                    <span className='absolute bottom-0.5 left-1 z-10 text-[9px] font-mono font-semibold text-white/90 drop-shadow-xs'>
                      {formattedFrame}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Gradient Fadeout Overlay & CTA */}
            <div className='absolute inset-x-0 bottom-0 h-32 sm:h-40 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center pb-4 sm:pb-5 pointer-events-none'>
              <div className='pointer-events-auto'>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenContactSheet();
                  }}
                  className='group-hover:scale-[1.02] inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-foreground text-background text-xs sm:text-[13px] font-mono tracking-wider font-medium shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer'
                >
                  <IconLayoutGrid className='size-3.5 sm:size-4' />
                  <span>Kontaktbogen dieser Session ansehen</span>
                  <span className='opacity-60 text-[11px] sm:text-xs'>
                    ({totalFrames})
                  </span>
                  <IconArrowUpRight className='size-3.5 sm:size-4 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
