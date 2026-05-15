'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Collection } from '@/db/schema';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { Card, CardContent } from '@/components/ui/card';

interface CollectionCardProps {
  collection: Collection;
}

export const CollectionCard = ({ collection }: CollectionCardProps) => {
  const imageUrl = collection.coverImageUrl ? keyToUrl(collection.coverImageUrl) : null;

  return (
    <Link href={`/collections/${collection.slug}`} className='group'>
      <Card className='overflow-hidden border-none bg-muted/30 transition-all hover:bg-muted/50 rounded-2xl'>
        <CardContent className='p-0'>
          <div className='relative aspect-[16/9] w-full overflow-hidden'>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={collection.name}
                fill
                className='object-cover transition-transform duration-500 group-hover:scale-105'
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center bg-muted'>
                <span className='text-2xl font-bold text-muted-foreground'>
                  {collection.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            {collection.isFeatured && (
              <div className='absolute top-3 right-3 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm'>
                Featured
              </div>
            )}
          </div>
          <div className='p-5'>
            <h3 className='text-lg font-bold group-hover:text-primary transition-colors'>
              {collection.name}
            </h3>
            {collection.description && (
              <p className='mt-1 text-sm text-foreground/70 line-clamp-2 font-light'>
                {collection.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
