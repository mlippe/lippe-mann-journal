'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  IconArrowLeft,
  IconZoomIn,
  IconArrowUp,
  IconArrowDown,
  IconSparkles,
  IconColumns,
  IconSquare,
  IconCheck,
  IconRotateClockwise,
} from '@tabler/icons-react';

interface PickItem {
  photoId: string;
  revisitedOrder: number;
  layoutPosition: 'left' | 'right' | 'solo';
  isHighlight: boolean;
}

export const SessionRevisitView = ({ slug }: { slug: string }) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: post } = useSuspenseQuery(
    trpc.posts.getOne.queryOptions({ slug }),
  );

  // Chronologically sorted session photos from join table
  const allSessionPhotos = useMemo(() => {
    if (!post.postsToPhotos) return [];
    return [...post.postsToPhotos]
      .sort(
        (a, b) =>
          ((a as { frameNumber?: number }).frameNumber ?? 0) -
          ((b as { frameNumber?: number }).frameNumber ?? 0),
      )
      .map((ptp) => ({
        ...ptp.photo,
        frameNumber: (ptp as { frameNumber?: number | null }).frameNumber ?? 1,
        isInitialPick: Boolean((ptp as { isInitialPick?: boolean | null }).isInitialPick),
        initialOrder: (ptp as { initialOrder?: number | null }).initialOrder ?? null,
        isRevisitedPick: Boolean((ptp as { isRevisitedPick?: boolean | null }).isRevisitedPick),
        revisitedOrder: (ptp as { revisitedOrder?: number | null }).revisitedOrder ?? null,
        layoutPosition:
          ((ptp as { layoutPosition?: 'left' | 'right' | 'solo' | null })
            .layoutPosition as 'left' | 'right' | 'solo') || 'solo',
        isHighlight: Boolean((ptp as { isHighlight?: boolean }).isHighlight),
      }));
  }, [post.postsToPhotos]);

  // Initial state of revisited picks
  const initialRevisitedPicks = useMemo<PickItem[]>(() => {
    return allSessionPhotos
      .filter((p) => p.isRevisitedPick)
      .sort((a, b) => (a.revisitedOrder ?? 0) - (b.revisitedOrder ?? 0))
      .map((p, idx) => ({
        photoId: p.id,
        revisitedOrder: idx,
        layoutPosition: p.layoutPosition,
        isHighlight: p.isHighlight,
      }));
  }, [allSessionPhotos]);

  const [revisitedPicks, setRevisitedPicks] = useState<PickItem[]>(initialRevisitedPicks);
  const [revisitedNote, setRevisitedNote] = useState<string>(
    post.revisitedNote || '',
  );
  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    frameNumber: number;
  } | null>(null);

  const revisitMutation = useMutation(
    trpc.posts.revisitSession.mutationOptions(),
  );

  // Toggle revisited pick
  const toggleRevisitedPick = (photoId: string) => {
    const existingIndex = revisitedPicks.findIndex((p) => p.photoId === photoId);
    if (existingIndex !== -1) {
      // Remove and re-index
      const updated = revisitedPicks
        .filter((p) => p.photoId !== photoId)
        .map((p, idx) => ({ ...p, revisitedOrder: idx }));
      setRevisitedPicks(updated);
    } else {
      // Add to revisited picks
      const newItem: PickItem = {
        photoId,
        revisitedOrder: revisitedPicks.length,
        layoutPosition: 'solo',
        isHighlight: false,
      };
      setRevisitedPicks([...revisitedPicks, newItem]);
    }
  };

  // Reordering in pacing list
  const moveRevisitedItem = (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= revisitedPicks.length) return;

    const updated = [...revisitedPicks];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setRevisitedPicks(updated.map((p, idx) => ({ ...p, revisitedOrder: idx })));
  };

  // Layout updates
  const updateLayout = (
    photoId: string,
    updates: Partial<PickItem>,
  ) => {
    setRevisitedPicks((prev) =>
      prev.map((p) => (p.photoId === photoId ? { ...p, ...updates } : p)),
    );
  };

  const handleSave = async () => {
    if (revisitedPicks.length === 0) {
      toast.error('Bitte wähle mindestens 1 Bild für die Neuauswahl aus.');
      return;
    }

    try {
      await revisitMutation.mutateAsync({
        postId: post.id,
        revisitedNote: revisitedNote.trim() || undefined,
        picks: revisitedPicks.map((p, idx) => ({
          photoId: p.photoId,
          revisitedOrder: idx,
          layoutPosition: p.layoutPosition,
          isHighlight: p.isHighlight,
        })),
      });

      await Promise.all([
        queryClient.invalidateQueries(trpc.posts.getOne.queryOptions({ slug })),
        queryClient.invalidateQueries(trpc.posts.getMany.queryOptions({})),
        queryClient.invalidateQueries(trpc.posts.getPublished.queryOptions({})),
        queryClient.invalidateQueries(trpc.blog.getMany.queryOptions()),
      ]);

      toast.success('Neuauswahl erfolgreich gespeichert!');
      router.push(`/session/${post.slug}`);
    } catch (error) {
      console.error('Revisit error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Fehler beim Speichern',
      );
    }
  };

  const photoMap = useMemo(() => {
    return new Map(allSessionPhotos.map((p) => [p.id, p]));
  }, [allSessionPhotos]);

  return (
    <div className='max-w-4xl mx-auto px-4 py-8 space-y-10 pb-32'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6'>
        <div>
          <div className='flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-widest font-semibold mb-1'>
            <IconRotateClockwise className='size-4' />
            <span>Session-Neuauswahl</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>
            {post.title}
          </h1>
          <p className='text-xs sm:text-sm text-muted-foreground mt-1'>
            Kuratieren mit zeitlichem Abstand. Wähle deinen neuen Blickwinkel auf die {allSessionPhotos.length} Frames.
          </p>
        </div>

        <Button
          variant='ghost'
          size='sm'
          onClick={() => router.push(`/dashboard/posts/${post.slug}`)}
        >
          <IconArrowLeft className='size-4 mr-1' />
          Zurück zum Beitrag
        </Button>
      </div>

      {/* Marker Legend */}
      <div className='flex flex-wrap items-center gap-4 text-xs font-mono p-3 rounded-xl bg-card border border-border/70 text-muted-foreground'>
        <div className='flex items-center gap-2'>
          <span className='size-2 rounded-full ring-1 ring-amber-400/80 bg-amber-400/20' />
          <span>Erstauswahl (damals)</span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='size-2 rounded-full ring-1 ring-red-500/80 bg-red-500/20' />
          <span>Neuauswahl (heute)</span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='size-2 rounded-full ring-1 ring-red-500 border border-amber-400 bg-red-500/20' />
          <span>In beiden Auswahlen</span>
        </div>
      </div>

      {/* 1. Kontaktbogen Grid */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-base sm:text-lg font-semibold tracking-tight'>
            1. Kontaktbogen durchsuchen & auswählen
          </h2>
          <span className='text-xs font-mono text-muted-foreground'>
            <strong className='text-foreground'>{revisitedPicks.length}</strong> Frames für Neuauswahl ausgewählt
          </span>
        </div>

        <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3'>
          {allSessionPhotos.map((photo) => {
            const formattedFrame = String(photo.frameNumber).padStart(2, '0');
            const isInitial = photo.isInitialPick;
            const revPick = revisitedPicks.find((p) => p.photoId === photo.id);
            const isRevisited = Boolean(revPick);
            const isBoth = isInitial && isRevisited;

            return (
              <div
                key={photo.id}
                onClick={() => toggleRevisitedPick(photo.id)}
                className={cn(
                  'group relative aspect-[3/2] w-full overflow-hidden rounded-xs bg-muted border select-none cursor-pointer transition-all duration-200',
                  isBoth
                    ? 'border-amber-400/80 ring-1 ring-red-500/90'
                    : isRevisited
                      ? 'border-red-500/70 ring-1 ring-red-500/70'
                      : isInitial
                        ? 'border-amber-400/70 ring-1 ring-amber-400/70'
                        : 'border-border/80 hover:border-foreground/40',
                )}
              >
                <Image
                  src={keyToUrl(photo.url)}
                  alt={photo.title || `Frame ${formattedFrame}`}
                  fill
                  sizes='(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw'
                  className='object-cover'
                />

                <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none' />

                {/* Neutral Badges */}
                <div className='absolute top-1 right-1 z-10 flex items-center gap-0.5 font-mono text-[9px] font-medium'>
                  {isBoth ? (
                    <span className='bg-black/80 text-white border border-white/10 px-1.5 py-0.5 rounded-xs shadow-xs'>
                      Neu #{revPick!.revisitedOrder + 1} · Beide
                    </span>
                  ) : isRevisited ? (
                    <span className='bg-black/80 text-white border border-white/10 px-1.5 py-0.5 rounded-xs shadow-xs'>
                      Neu #{revPick!.revisitedOrder + 1}
                    </span>
                  ) : isInitial ? (
                    <span className='bg-black/80 text-zinc-300 border border-white/10 px-1 py-0.5 rounded-xs shadow-xs'>
                      Erst
                    </span>
                  ) : null}
                </div>

                {/* Frame index */}
                <div className='absolute bottom-1 left-1.5 z-10 font-mono text-[10px] font-semibold text-white drop-shadow-md'>
                  {formattedFrame}
                </div>

                {/* Loupe button */}
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewPhoto({
                      url: photo.url,
                      frameNumber: photo.frameNumber,
                    });
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
      </div>

      {/* 2. Pacing & Reordering of Revisited Selection */}
      {revisitedPicks.length > 0 && (
        <div className='space-y-4 pt-6 border-t border-border/70'>
          <h2 className='text-base sm:text-lg font-semibold tracking-tight'>
            2. Reihenfolge der Neuauswahl ({revisitedPicks.length} Frames)
          </h2>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            Bestimme Reihenfolge und Bildrhythmus für die neu kuratierte Auswahl.
          </p>

          <div className='space-y-3'>
            {revisitedPicks.map((pick, index) => {
              const photo = photoMap.get(pick.photoId);
              if (!photo) return null;

              const formattedFrame = String(photo.frameNumber).padStart(2, '0');
              const isHero = pick.isHighlight;
              const isLeft = pick.layoutPosition === 'left';
              const isRight = pick.layoutPosition === 'right';
              const isPaired = isLeft || isRight;
              const canPairWithNext = index < revisitedPicks.length - 1;

              return (
                <div
                  key={pick.photoId}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border bg-card transition-all',
                    isHero
                      ? 'border-foreground/50 ring-1 ring-foreground/20 bg-muted/20'
                      : isPaired
                        ? 'border-primary/60 ring-1 ring-primary/20'
                        : 'border-border/80',
                  )}
                >
                  <div className='flex items-center gap-3'>
                    <span className='font-mono font-bold text-xs size-6 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0'>
                      {index + 1}
                    </span>

                    <div className='relative w-20 h-14 sm:w-24 sm:h-16 rounded-md overflow-hidden bg-black/10 shrink-0 border border-border/60'>
                      <Image
                        src={keyToUrl(photo.url)}
                        alt={photo.title || `Frame ${formattedFrame}`}
                        fill
                        sizes='96px'
                        className='object-cover'
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
                          ? 'Hero Highlight'
                          : isLeft
                            ? 'Diptych Links'
                            : isRight
                              ? 'Diptych Rechts'
                              : 'Solo'}
                      </p>
                    </div>
                  </div>

                  <div className='hidden sm:flex flex-col flex-1 min-w-0'>
                    <span className='text-xs font-mono font-semibold truncate'>
                      Frame {formattedFrame}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {isHero
                        ? '★ Feature Plate'
                        : isLeft
                          ? '◫ Diptych (Links)'
                          : isRight
                            ? '◫ Diptych (Rechts)'
                            : '◻ Solo'}
                    </span>
                  </div>

                  {/* Controls */}
                  <div className='flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40'>
                    <div className='flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg text-xs'>
                      <button
                        type='button'
                        onClick={() =>
                          updateLayout(pick.photoId, {
                            layoutPosition: 'solo',
                            isHighlight: false,
                          })
                        }
                        className={cn(
                          'px-2 py-1 rounded-md transition-all flex items-center gap-1 text-[11px]',
                          !isHero && !isPaired
                            ? 'bg-background shadow-xs font-medium text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <IconSquare className='size-3.5' />
                        <span className='hidden sm:inline'>Solo</span>
                      </button>

                      <button
                        type='button'
                        onClick={() =>
                          updateLayout(pick.photoId, {
                            layoutPosition: 'solo',
                            isHighlight: true,
                          })
                        }
                        className={cn(
                          'px-2 py-1 rounded-md transition-all flex items-center gap-1 text-[11px]',
                          isHero
                            ? 'bg-foreground text-background font-semibold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <IconSparkles className='size-3.5' />
                        <span className='hidden sm:inline'>Hero</span>
                      </button>

                      <button
                        type='button'
                        onClick={() => {
                          if (isLeft || isRight) {
                            updateLayout(pick.photoId, { layoutPosition: 'solo' });
                          } else if (canPairWithNext) {
                            updateLayout(pick.photoId, {
                              layoutPosition: 'left',
                              isHighlight: false,
                            });
                            updateLayout(revisitedPicks[index + 1].photoId, {
                              layoutPosition: 'right',
                              isHighlight: false,
                            });
                          }
                        }}
                        disabled={!isPaired && !canPairWithNext}
                        className={cn(
                          'px-2 py-1 rounded-md transition-all flex items-center gap-1 text-[11px] disabled:opacity-30',
                          isPaired
                            ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <IconColumns className='size-3.5' />
                        <span className='hidden sm:inline'>
                          {isLeft ? 'Diptych L' : isRight ? 'Diptych R' : 'Paaren'}
                        </span>
                      </button>
                    </div>

                    <div className='flex items-center gap-0.5'>
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        className='size-7'
                        onClick={() => moveRevisitedItem(index, 'up')}
                        disabled={index === 0}
                      >
                        <IconArrowUp className='size-3.5' />
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        className='size-7'
                        onClick={() => moveRevisitedItem(index, 'down')}
                        disabled={index === revisitedPicks.length - 1}
                      >
                        <IconArrowDown className='size-3.5' />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Retrospective Note */}
      <div className='space-y-3 pt-6 border-t border-border/70'>
        <Label htmlFor='revisited-note' className='text-base font-semibold'>
          3. Retrospektive Notiz (optional)
        </Label>
        <p className='text-xs sm:text-sm text-muted-foreground'>
          Erkläre deinen Sinneswandel in 1–2 Sätzen. Diese Notiz wird Lesern im Auswahl-Umschalter angezeigt.
        </p>
        <Textarea
          id='revisited-note'
          placeholder='z.B. 6 Wochen später neu betrachtet: Frame 14 hatte rückblickend das viel ruhigere Morgenlicht als Frame 08...'
          rows={3}
          value={revisitedNote}
          onChange={(e) => setRevisitedNote(e.target.value)}
        />
      </div>

      {/* Floating Sticky Commit Bar */}
      <div className='fixed bottom-6 inset-x-0 px-4 flex justify-center z-40 pointer-events-none'>
        <div className='pointer-events-auto flex items-center gap-3 bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-full px-5 py-3 shadow-2xl backdrop-blur-md text-xs sm:text-sm font-mono'>
          <span>
            Neuauswahl: <strong className='text-zinc-100'>{revisitedPicks.length}</strong> Frames
          </span>
          <Button
            size='sm'
            onClick={handleSave}
            disabled={revisitedPicks.length === 0 || revisitMutation.isPending}
            className='bg-white text-zinc-950 hover:bg-zinc-200 font-semibold rounded-full px-5 h-8 text-xs cursor-pointer'
          >
            <IconCheck className='size-3.5 mr-1' />
            <span>Neuauswahl speichern</span>
          </Button>
        </div>
      </div>

      {/* Loupe Modal */}
      <Dialog
        open={previewPhoto !== null}
        onOpenChange={(open) => !open && setPreviewPhoto(null)}
      >
        <DialogContent className='max-w-4xl p-1 bg-black text-white border-zinc-800 overflow-hidden'>
          <DialogTitle className='sr-only'>Vorschau</DialogTitle>
          {previewPhoto && (
            <div className='relative w-full aspect-[3/2] max-h-[80vh] flex items-center justify-center'>
              <Image
                src={keyToUrl(previewPhoto.url)}
                alt={`Frame ${previewPhoto.frameNumber}`}
                fill
                className='object-contain'
                sizes='100vw'
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
