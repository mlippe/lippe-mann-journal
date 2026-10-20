'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { s3Client, AllowedContentType } from '@/modules/s3/lib/upload-client';
import { DEFAULT_PHOTOS_UPLOAD_FOLDER } from '@/constants';
import { SessionPhotoDraft, SessionWizardStep } from './types';
import { UploadStep } from './upload-step';
import { GridStep } from './grid-step';
import { PacingStep } from './pacing-step';
import { PublishStep } from './publish-step';

export const CreateSession = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<SessionWizardStep>('upload');
  const [photos, setPhotos] = useState<SessionPhotoDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPresignedUrl = useMutation(
    trpc.s3.createPresignedUrl.mutationOptions(),
  );
  const createSession = useMutation(trpc.posts.createSession.mutationOptions());

  // Concurrency tracking
  const activeUploadsRef = useRef<Set<string>>(new Set());
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Screen Wake Lock
  const requestWakeLock = useCallback(async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator && !wakeLockRef.current) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // Ignore wakeLock errors (e.g. low battery, non-https, or unsupported)
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Ignore
      }
      wakeLockRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  // Upload worker: Concurrency up to 3
  useEffect(() => {
    if (photos.length === 0) return;

    const unuploaded = photos.filter(
      (p) => !p.isUploaded && !p.isUploading && !p.uploadError && !activeUploadsRef.current.has(p.id),
    );

    const activeCount = activeUploadsRef.current.size;
    const availableSlots = 3 - activeCount;

    if (activeCount > 0) {
      requestWakeLock();
    } else if (unuploaded.length === 0) {
      releaseWakeLock();
    }

    if (availableSlots <= 0 || unuploaded.length === 0) return;

    const batch = unuploaded.slice(0, availableSlots);

    batch.forEach(async (photo) => {
      activeUploadsRef.current.add(photo.id);

      // Mark as uploading in state
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, isUploading: true } : p)),
      );

      try {
        const { publicUrl } = await s3Client.upload({
          file: photo.file,
          folder: DEFAULT_PHOTOS_UPLOAD_FOLDER,
          getUploadUrl: async ({ filename, contentType, folder }) => {
            const data = await createPresignedUrl.mutateAsync({
              filename,
              contentType: contentType as AllowedContentType,
              size: photo.file.size,
              folder,
            });
            return {
              uploadUrl: data.presignedUrl,
              publicUrl: data.key,
            };
          },
        });

        activeUploadsRef.current.delete(photo.id);
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? {
                  ...p,
                  isUploaded: true,
                  isUploading: false,
                  uploadedUrl: publicUrl,
                  uploadError: null,
                }
              : p,
          ),
        );
      } catch (err) {
        activeUploadsRef.current.delete(photo.id);
        const errMsg = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? { ...p, isUploading: false, uploadError: errMsg }
              : p,
          ),
        );
      }
    });
  }, [photos, createPresignedUrl, requestWakeLock, releaseWakeLock]);

  // Handle photos loaded from UploadStep
  const handlePhotosReady = (drafts: SessionPhotoDraft[]) => {
    setPhotos(drafts);
    setStep('grid');
  };

  // Toggle Initial Pick in Grid Step
  const handleTogglePick = (photoId: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === photoId);
      if (!target) return prev;

      if (target.isInitialPick) {
        // Deselect and re-index remaining
        const remainingPicks = prev
          .filter((p) => p.isInitialPick && p.id !== photoId)
          .sort((a, b) => (a.initialOrder ?? 0) - (b.initialOrder ?? 0));

        const orderMap = new Map(
          remainingPicks.map((p, idx) => [p.id, idx]),
        );

        return prev.map((p) => {
          if (p.id === photoId) {
            return {
              ...p,
              isInitialPick: false,
              initialOrder: null,
              layoutPosition: 'solo',
              isHighlight: false,
            };
          }
          if (p.isInitialPick) {
            return {
              ...p,
              initialOrder: orderMap.get(p.id) ?? null,
            };
          }
          return p;
        });
      } else {
        // Select and append to picks
        const currentPicksCount = prev.filter((p) => p.isInitialPick).length;
        return prev.map((p) =>
          p.id === photoId
            ? {
                ...p,
                isInitialPick: true,
                initialOrder: currentPicksCount,
              }
            : p,
        );
      }
    });
  };

  // Update single photo in Pacing Step
  const handleUpdatePhoto = (
    photoId: string,
    updates: Partial<SessionPhotoDraft>,
  ) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, ...updates } : p)),
    );
  };

  // Reorder picks in Pacing Step
  const handleReorderPicks = (newOrderedPickedIds: string[]) => {
    const orderMap = new Map(
      newOrderedPickedIds.map((id, index) => [id, index]),
    );

    setPhotos((prev) =>
      prev.map((p) => {
        if (p.isInitialPick && orderMap.has(p.id)) {
          return {
            ...p,
            initialOrder: orderMap.get(p.id)!,
          };
        }
        return p;
      }),
    );
  };

  // Retry failed uploads in Publish Step
  const handleRetryFailedUploads = () => {
    setPhotos((prev) =>
      prev.map((p) => (p.uploadError ? { ...p, uploadError: null } : p)),
    );
  };

  // Publish Session
  const handlePublish = async (data: {
    title: string;
    slug?: string;
    content?: string;
    visibility: 'public' | 'private';
    tags: string[];
    collectionIds: string[];
  }) => {
    setIsSubmitting(true);

    try {
      // Validate that all photos are uploaded
      const missingUpload = photos.find((p) => !p.uploadedUrl);
      if (missingUpload) {
        toast.error('Einige Fotos sind noch nicht hochgeladen. Bitte kurz warten.');
        setIsSubmitting(false);
        return;
      }

      const inputPhotos = photos.map((p) => ({
        id: p.id,
        url: p.uploadedUrl!,
        title: p.title,
        width: p.width,
        height: p.height,
        aspectRatio: p.aspectRatio,
        blurData: p.blurData,
        frameNumber: p.frameNumber,
        isInitialPick: p.isInitialPick,
        initialOrder: p.initialOrder,
        layoutPosition: p.layoutPosition,
        isHighlight: p.isHighlight,
        make: p.make,
        model: p.model,
        lensModel: p.lensModel,
        focalLength: p.focalLength,
        focalLength35mm: p.focalLength35mm,
        fNumber: p.fNumber,
        iso: p.iso,
        exposureTime: p.exposureTime,
        exposureCompensation: p.exposureCompensation,
        latitude: p.latitude,
        longitude: p.longitude,
        dateTimeOriginal: p.dateTimeOriginal,
      }));

      const newPost = await createSession.mutateAsync({
        title: data.title,
        slug: data.slug,
        content: data.content,
        visibility: data.visibility,
        tags: data.tags,
        collectionIds: data.collectionIds,
        photos: inputPhotos,
      });

      await Promise.all([
        queryClient.invalidateQueries(trpc.posts.getMany.queryOptions({})),
        queryClient.invalidateQueries(trpc.posts.getPublished.queryOptions({})),
        queryClient.invalidateQueries(trpc.blog.getMany.queryOptions()),
      ]);

      toast.success('Session erfolgreich veröffentlicht!');
      router.push(`/session/${newPost.slug}`);
    } catch (error) {
      console.error('Session publishing error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Fehler beim Veröffentlichen',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload Progress Text for header badge
  const uploadedCount = photos.filter((p) => p.isUploaded).length;
  const uploadProgressText =
    photos.length > 0
      ? uploadedCount === photos.length
        ? `✓ ${photos.length}/${photos.length} Frames`
        : `Upload ${uploadedCount}/${photos.length}`
      : undefined;

  return (
    <div className='w-full min-h-[calc(100vh-8rem)] px-4 sm:px-6 py-4 sm:py-8'>
      {step === 'upload' && <UploadStep onPhotosReady={handlePhotosReady} />}

      {step === 'grid' && (
        <GridStep
          photos={photos}
          onTogglePick={handleTogglePick}
          onProceed={() => setStep('pacing')}
          onBack={() => setStep('upload')}
          uploadProgressText={uploadProgressText}
        />
      )}

      {step === 'pacing' && (
        <PacingStep
          photos={photos}
          onUpdatePhoto={handleUpdatePhoto}
          onReorderPicks={handleReorderPicks}
          onProceed={() => setStep('publish')}
          onBack={() => setStep('grid')}
          uploadProgressText={uploadProgressText}
        />
      )}

      {step === 'publish' && (
        <PublishStep
          photos={photos}
          onBack={() => setStep('pacing')}
          onSubmit={handlePublish}
          isSubmitting={isSubmitting}
          onRetryFailedUploads={handleRetryFailedUploads}
        />
      )}
    </div>
  );
};
