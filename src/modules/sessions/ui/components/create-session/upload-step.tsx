'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Loader2 } from 'lucide-react';
import { IconCamera } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import {
  getPhotoExif,
  getImageInfo,
} from '@/modules/photos/lib/utils';
import { SessionPhotoDraft } from './types';
import { toast } from 'sonner';

interface UploadStepProps {
  onPhotosReady: (photos: SessionPhotoDraft[]) => void;
}

export const UploadStep = ({ onPhotosReady }: UploadStepProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    multiple: true,
    onDrop: async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsProcessing(true);
      setStatusText('Lese Aufnahmezeitpunkte & EXIF aus...');

      try {
        // 1. Parse EXIF and dimensions for all files in parallel
        const parsedResults = await Promise.all(
          acceptedFiles.map(async (file) => {
            const [exif, imageInfo] = await Promise.all([
              getPhotoExif(file).catch(() => null),
              getImageInfo(file).catch(() => ({
                width: 1,
                height: 1,
                aspectRatio: 1.5,
                blurhash: '',
                fileName: file.name,
              })),
            ]);

            const width =
              Number.isFinite(imageInfo.width) && imageInfo.width > 0
                ? imageInfo.width
                : 1;
            const height =
              Number.isFinite(imageInfo.height) && imageInfo.height > 0
                ? imageInfo.height
                : 1;
            const aspectRatio =
              Number.isFinite(imageInfo.aspectRatio) &&
              imageInfo.aspectRatio > 0
                ? imageInfo.aspectRatio
                : Number((width / height).toFixed(2)) || 1.5;

            // Capture timestamp: prefer EXIF dateTimeOriginal, fallback to file.lastModified
            const captureTimestamp = exif?.dateTimeOriginal
              ? new Date(exif.dateTimeOriginal).getTime()
              : file.lastModified;

            return {
              file,
              exif,
              imageInfo,
              width,
              height,
              aspectRatio,
              captureTimestamp,
            };
          }),
        );

        // 2. Sort chronologically from earliest to latest
        parsedResults.sort((a, b) => a.captureTimestamp - b.captureTimestamp);

        // 3. Build SessionPhotoDrafts with sequential frame numbers 1..N
        const drafts: SessionPhotoDraft[] = parsedResults.map(
          (item, index) => {
            const frameNumber = index + 1;
            const previewUrl = URL.createObjectURL(item.file);

            return {
              id: crypto.randomUUID(),
              file: item.file,
              previewUrl,
              title:
                item.imageInfo.fileName?.trim() ||
                `Aufnahme ${String(frameNumber).padStart(2, '0')}`,
              width: item.width,
              height: item.height,
              aspectRatio: item.aspectRatio,
              blurData: item.imageInfo.blurhash || '',
              frameNumber,
              isInitialPick: false,
              initialOrder: null,
              layoutPosition: 'solo',
              isHighlight: false,
              make: item.exif?.make ?? null,
              model: item.exif?.model ?? null,
              lensModel: item.exif?.lensModel ?? null,
              focalLength: item.exif?.focalLength ?? null,
              focalLength35mm: item.exif?.focalLength35mm ?? null,
              fNumber: item.exif?.fNumber ?? null,
              iso: item.exif?.iso ?? null,
              exposureTime: item.exif?.exposureTime ?? null,
              exposureCompensation: item.exif?.exposureCompensation ?? null,
              latitude: item.exif?.latitude ?? null,
              longitude: item.exif?.longitude ?? null,
              dateTimeOriginal: item.exif?.dateTimeOriginal ?? new Date(item.file.lastModified),
              isUploaded: false,
              isUploading: false,
            };
          },
        );

        toast.success(
          `${drafts.length} Aufnahmen erfolgreich chronologisch sortiert.`,
        );
        onPhotosReady(drafts);
      } catch (error) {
        console.error('Session photos processing error:', error);
        toast.error('Fehler beim Einlesen der Fotos.');
      } finally {
        setIsProcessing(false);
        setStatusText('');
      }
    },
  });

  return (
    <div className='w-full max-w-2xl mx-auto py-8 sm:py-12'>
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 text-center',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border/80 hover:border-primary/60 hover:bg-muted/30 bg-card',
          isProcessing && 'pointer-events-none opacity-60',
        )}
      >
        <input {...getInputProps()} disabled={isProcessing} />

        <div className='size-16 sm:size-20 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground'>
          {isProcessing ? (
            <Loader2 className='size-8 sm:size-10 animate-spin text-primary' />
          ) : (
            <UploadCloud className='size-8 sm:size-10' />
          )}
        </div>

        <h3 className='text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2'>
          <IconCamera className='size-5 text-primary' />
          <span>Session-Fotos auswählen</span>
        </h3>

        <p className='text-sm text-muted-foreground max-w-md mb-4'>
          Lade alle Bilder deines Spaziergangs oder Ausflugs hoch (~36 Aufnahmen empfohlen).
          Wir ordnen sie automatisch chronologisch nach Aufnahmezeitpunkt (Aufnahme 01–N).
        </p>

        {isProcessing ? (
          <p className='text-xs font-mono text-primary animate-pulse'>
            {statusText}
          </p>
        ) : (
          <span className='inline-flex items-center px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-sm'>
            Dateien auswählen oder hierher ziehen
          </span>
        )}
      </div>
    </div>
  );
};
