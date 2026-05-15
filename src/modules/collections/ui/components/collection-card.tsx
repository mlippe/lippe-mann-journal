'use client';

import Link from 'next/link';
import Image from 'next/image';
import { EnhancedCollection } from '@/db/schema';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { Card, CardContent } from '@/components/ui/card';

interface CollectionCardProps {
  collection: EnhancedCollection;
}

export const CollectionCard = ({ collection }: CollectionCardProps) => {
  const imageUrl = collection.coverImageUrl
    ? keyToUrl(collection.coverImageUrl)
    : collection.latestPostImage
      ? keyToUrl(collection.latestPostImage)
      : null;

  console.log('collection card', collection);

  return (
    <Link href={`/collections/${collection.slug}`} className='group'>
      <Card className='overflow-hidden border-none bg-muted/30 transition-all hover:bg-muted/50 rounded-2xl py-0 h-full'>
        <CardContent className='p-0 relative'>
          <div className='relative aspect-[1] w-full'>
            {imageUrl ? (
              <>
                <Image
                  src={imageUrl}
                  alt={collection.name}
                  fill
                  className='inset-0 object-contain blur-2xl transition-transform duration-500 group-hover:scale-130 scale-110 opacity-'
                />
                <Image
                  src={imageUrl}
                  alt={collection.name}
                  fill
                  className='object-contain object-top transition-transform duration-500 group-hover:scale-105'
                />
              </>
            ) : (
              <div className='flex h-full w-full items-center justify-center bg-muted'>
                <span className='text-2xl font-bold text-muted-foreground'>
                  {collection.name.substring(0, 5).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          {collection.isFeatured && (
            <div className='absolute top-3 right-3 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm'>
              Featured
            </div>
          )}
          <div className='p-3 pt-2 -mt-4  relative z-5 bg-background m-2 rounded-2xl'>
            <h3 className='text-lg font-bold text-center group-hover:text-primary transition-colors'>
              {collection.name}
            </h3>
            {collection.description && (
              <p className='mt-0.5 text-sm text-center text-foreground/70 line-clamp-2 font-light'>
                {collection.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
