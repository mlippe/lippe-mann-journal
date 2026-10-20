'use client';

import { cn } from '@/lib/utils';
import BlurImage from './blur-image';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';

interface FramedPhotoProps {
  src: string;
  alt?: string;
  blurhash: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  className?: string;
}

export function FramedPhoto({
  src,
  alt = 'Foto',
  blurhash,
  width,
  height,
  aspectRatio,
  className,
}: FramedPhotoProps) {
  const resolvedAspectRatio =
    aspectRatio ||
    (typeof width === 'number' && typeof height === 'number' && height > 0
      ? width / height
      : undefined);

  return (
    <div
      className={cn(
        'group relative mx-auto w-full max-h-[60vh] overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm transition-all duration-300 hover:shadow-md',
        !resolvedAspectRatio && 'aspect-4/3',
        className,
      )}
      style={
        resolvedAspectRatio
          ? {
              aspectRatio: `${resolvedAspectRatio}`,
            }
          : undefined
      }
    >
      <BlurImage
        src={keyToUrl(src)}
        alt={alt}
        blurhash={blurhash}
        fill
        aspectRatio={resolvedAspectRatio}
        className='object-contain'
        sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw'
        priority
      />
    </div>
  );
}
