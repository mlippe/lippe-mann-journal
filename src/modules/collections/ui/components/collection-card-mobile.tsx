'use client';

import { Collection } from '@/db/schema';
import { useRouter } from 'next/navigation';
import BlurImage from '@/components/blur-image';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { CollectionActions } from './collection-actions';
import { Badge } from '@/components/ui/badge';
import { IconFolder } from '@tabler/icons-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface CollectionCardMobileProps {
  collection: Collection;
}

export function CollectionCardMobile({ collection }: CollectionCardMobileProps) {
  const router = useRouter();
  const editPath = `/dashboard/collections/${collection.slug}`;

  const formattedDate = collection.updatedAt
    ? format(new Date(collection.updatedAt), 'dd.MM.yy', { locale: de })
    : '';

  return (
    <div
      onClick={() => router.push(editPath)}
      className='group relative flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 active:scale-[0.99] transition-all cursor-pointer shadow-2xs'
    >
      {/* Thumbnail */}
      <div className='relative size-14 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border/40'>
        {collection.coverImageUrl ? (
          <BlurImage
            src={keyToUrl(collection.coverImageUrl)}
            alt={collection.name}
            fill
            className='object-cover'
            sizes='56px'
          />
        ) : (
          <IconFolder className='size-6 text-muted-foreground' />
        )}
      </div>

      {/* Info */}
      <div className='flex-1 min-w-0'>
        <h3 className='text-sm font-medium text-foreground truncate'>
          {collection.name}
        </h3>
        <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
          {collection.isFeatured ? (
            <Badge variant='secondary' className='text-[10px] px-1.5 py-0'>
              Featured
            </Badge>
          ) : (
            <Badge variant='outline' className='text-[10px] px-1.5 py-0'>
              Standard
            </Badge>
          )}
          {formattedDate && (
            <span className='text-[11px] text-muted-foreground/70'>
              Aktualisiert {formattedDate}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div onClick={(e) => e.stopPropagation()} className='shrink-0'>
        <CollectionActions collection={collection} />
      </div>
    </div>
  );
}
