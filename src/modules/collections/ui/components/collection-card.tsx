'use client';

import Link from 'next/link';
import { EnhancedCollection } from '@/db/schema';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import BlurImage from '@/components/blur-image';
import { ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface CollectionCardProps {
  collection: EnhancedCollection;
  index?: number;
  priority?: boolean;
}

export const CollectionCard = ({
  collection,
  index,
  priority = false,
}: CollectionCardProps) => {
  const imageUrl = collection.coverImageUrl
    ? keyToUrl(collection.coverImageUrl)
    : collection.latestPostImage
      ? keyToUrl(collection.latestPostImage)
      : null;

  const formattedDate = collection.updatedAt
    ? format(new Date(collection.updatedAt), 'MMM yyyy', { locale: de })
    : null;

  const photoRatio = collection.aspectRatio || 2 / 3;

  return (
    <Link
      href={`/collections/${collection.slug}`}
      className='group block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground rounded-xl transition-all'
    >
      <article className='flex flex-col'>
        {/* Frame / Photograph Container matching exact photo aspect ratio without cropping */}
        <div
          className='relative w-full overflow-hidden rounded-xl bg-muted/20 border border-border/40 shadow-2xs'
          style={{ aspectRatio: `${photoRatio}` }}
        >
          {imageUrl ? (
            <BlurImage
              src={imageUrl}
              alt={collection.name}
              fill
              priority={priority}
              blurhash={collection.blurData || undefined}
              aspectRatio={photoRatio}
              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
              className='object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025]'
            />
          ) : (
            <div className='w-full h-full flex flex-col items-center justify-center bg-muted/30 p-6 text-center'>
              <span className='font-mono text-xs text-muted-foreground/60 tracking-[0.16em] uppercase'>
                {collection.name.slice(0, 3)}
              </span>
            </div>
          )}

          {/* Minimal Featured Tag */}
          {collection.isFeatured && (
            <div className='absolute top-3 left-3 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur-md border border-border/40 text-[10px] font-mono tracking-[0.14em] uppercase text-foreground/90 shadow-2xs select-none'>
              Featured
            </div>
          )}
        </div>

        {/* Content Block */}
        <div className='pt-3.5 sm:pt-4 flex flex-col gap-1.5'>
          {/* Header Line: Index + Title + Arrow */}
          <div className='flex items-baseline justify-between gap-3'>
            <div className='flex items-baseline gap-2.5 min-w-0'>
              {typeof index === 'number' && (
                <span className='font-mono text-xs text-muted-foreground/60 shrink-0 tabular-nums'>
                  {String(index + 1).padStart(2, '0')}
                </span>
              )}
              <h2 className='text-base sm:text-[17px] font-medium tracking-tight text-foreground truncate group-hover:text-foreground/80 transition-colors'>
                {collection.name}
              </h2>
            </div>
            <ArrowUpRight className='size-3.5 sm:size-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0' />
          </div>

          {/* Description */}
          {collection.description && (
            <p className='text-xs sm:text-[13px] text-muted-foreground/80 font-light leading-relaxed line-clamp-2'>
              {collection.description}
            </p>
          )}

          {/* Archival Metadata Line */}
          <div className='flex items-center gap-2 pt-2 mt-1 border-t border-border/25 text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wider'>
            <span>
              {collection.postCount}{' '}
              {collection.postCount === 1 ? 'Aufnahme' : 'Aufnahmen'}
            </span>
            {formattedDate && (
              <>
                <span className='opacity-60'>&middot;</span>
                <span>{formattedDate}</span>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
};
