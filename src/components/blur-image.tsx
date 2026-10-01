'use client';

import { useEffect, useState, useRef, memo } from 'react';
import Image, { ImageProps } from 'next/image';
import { Blurhash } from 'react-blurhash';
import { cn } from '@/lib/utils';

interface BlurImageProps extends Omit<
  ImageProps,
  'onLoad' | 'onLoadingComplete'
> {
  blurhash?: string | null;
  aspectRatio?: number;
}

function getSrcString(src: ImageProps['src']): string {
  if (typeof src === 'string') return src;
  if (src && typeof src === 'object') {
    if ('src' in src && typeof src.src === 'string') {
      return src.src;
    }
    if (
      'default' in src &&
      src.default &&
      typeof (src.default as { src: string }).src === 'string'
    ) {
      return (src.default as { src: string }).src;
    }
  }
  return '';
}

/**
 * BlurImage component displays an image with a blurhash placeholder.
 *
 * @param {string} src - The source of the image.
 * @param {string} alt - The alt text of the image.
 * @param {number} width - The width of the image.
 * @param {number} height - The height of the image.
 * @param {string} fill - The fill of the image.
 * @param {string} className - Optional className for the component.
 * @param {string} blurhash - The blurhash of the image.
 * @param {boolean} priority - Whether the image should be prioritized for loading.
 * @param {number} aspectRatio - Optional aspect ratio of the image (width / height).
 * @returns {JSX.Element} - The BlurImage component.
 */
const BlurImage = memo(function BlurImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  blurhash,
  priority,
  aspectRatio,
  style,
  ...props
}: BlurImageProps) {
  const srcString = getSrcString(src);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [prevSrc, setPrevSrc] = useState(srcString);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync state if src changes on the same component instance
  if (prevSrc !== srcString) {
    setPrevSrc(srcString);
    setImageLoaded(false);
    setShowPlaceholder(true);
  }

  // Check if image is already completed in browser cache on mount
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      const timer = setTimeout(() => {
        setImageLoaded(true);
        setShowPlaceholder(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [srcString]);

  // Handle placeholder fade-out after image is loaded
  useEffect(() => {
    if (!imageLoaded) return;

    const timeout = window.setTimeout(
      () => {
        setShowPlaceholder(false);
      },
      priority ? 0 : 350,
    );

    return () => window.clearTimeout(timeout);
  }, [imageLoaded, priority]);

  // Extract background classes to apply them only when loaded
  const hasBackground = className?.includes('bg-background');
  const baseClassName = className?.replace('bg-background', '').trim();

  const containerStyle = fill
    ? 'absolute inset-0 flex items-center justify-center'
    : 'relative w-full h-full flex justify-center items-center';

  const showBlurhash = showPlaceholder && blurhash && blurhash.length >= 6;
  const isObjectCover = className?.includes('object-cover');

  return (
    <div className={containerStyle}>
      {showBlurhash && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center pointer-events-none z-0',
            !priority && 'transition-opacity duration-300 ease-in-out',
            imageLoaded ? 'opacity-0' : 'opacity-100',
          )}
        >
          <div
            className={cn('overflow-hidden', baseClassName)}
            style={{
              aspectRatio: !isObjectCover && aspectRatio ? `${aspectRatio}` : undefined,
              width: isObjectCover
                ? '100%'
                : aspectRatio
                  ? aspectRatio > 0.8
                    ? '100%'
                    : 'auto'
                  : '100%',
              height: isObjectCover
                ? '100%'
                : aspectRatio
                  ? aspectRatio > 0.8
                    ? 'auto'
                    : '100%'
                  : '100%',
              maxHeight: '100%',
              maxWidth: '100%',
            }}
          >
            <Blurhash
              hash={blurhash}
              width='100%'
              height='100%'
              resolutionX={16}
              resolutionY={16}
              punch={1}
            />
          </div>
        </div>
      )}
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        priority={priority}
        style={!fill ? { width: '100%', height: 'auto', ...style } : style}
        className={cn(
          baseClassName,
          fill ? 'z-10' : 'relative z-10',
          hasBackground && imageLoaded && 'bg-background',
          priority
            ? 'opacity-100'
            : cn(
                'transition-opacity duration-300 ease-in-out',
                imageLoaded ? 'opacity-100' : 'opacity-0',
              ),
        )}
        onLoad={() => {
          setImageLoaded(true);
        }}
        onError={() => {
          setShowPlaceholder(false);
          setImageLoaded(true);
        }}
        {...props}
      />
    </div>
  );
});

export default BlurImage;
