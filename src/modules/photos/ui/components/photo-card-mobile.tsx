'use client';

import { photoGetMany } from '../../types';
import { useRouter } from 'next/navigation';
import BlurImage from '@/components/blur-image';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { PhotoActions } from './photo-actions';
import { formatExifDate } from '../../lib/utils';
import { IconCalendarEvent } from '@tabler/icons-react';

interface PhotoCardMobileProps {
  photo: photoGetMany[number];
}

export function PhotoCardMobile({ photo }: PhotoCardMobileProps) {
  const router = useRouter();
  const editPath = `/dashboard/photos/${photo.id}`;
  const imageUrl = keyToUrl(photo.url);

  const formattedDate = photo.dateTimeOriginal
    ? formatExifDate(photo.dateTimeOriginal, 'dd.MM.yy HH:mm')
    : null;

  return (
    <div
      onClick={() => router.push(editPath)}
      className='group relative flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 active:scale-[0.99] transition-all cursor-pointer shadow-2xs'
    >
      {/* Thumbnail */}
      <div className='relative size-14 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border/40'>
        <BlurImage
          src={imageUrl}
          alt={photo.title || 'Foto'}
          fill
          blurhash={photo.blurData}
          className='object-cover'
          sizes='56px'
        />
      </div>

      {/* Info */}
      <div className='flex-1 min-w-0'>
        <h3 className='text-sm font-medium text-foreground truncate'>
          {photo.title || 'Ohne Titel'}
        </h3>
        {formattedDate ? (
          <div className='flex items-center gap-1.5 mt-1 text-xs text-muted-foreground'>
            <IconCalendarEvent className='size-3.5 text-muted-foreground/70 shrink-0' />
            <span className='truncate'>{formattedDate}</span>
          </div>
        ) : (
          <span className='text-xs text-muted-foreground/60 mt-1 block'>
            Kein Aufnahmedatum
          </span>
        )}
      </div>

      {/* Actions */}
      <div onClick={(e) => e.stopPropagation()} className='shrink-0'>
        <PhotoActions photo={photo} />
      </div>
    </div>
  );
}
