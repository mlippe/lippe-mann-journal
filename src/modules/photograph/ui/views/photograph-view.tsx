'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { IconArrowsMaximize, IconX } from '@tabler/icons-react';
import Link from 'next/link';

import { PostGetOne } from '@/modules/posts/types';
import Author from '@/components/author';
import { format } from 'date-fns';
import { ExifPreview } from '@/modules/photos/ui/components/exif-preview';
import { TExifData } from '@/modules/photos/lib/utils';

export const PhotographView = ({ post }: { post: PostGetOne }) => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const router = useRouter();

  const handleOpenChange = (openState: boolean) => {
    console.log(openState);
    if (openState === false) {
      router.back();
    }
    setIsModalOpen(openState);
  };

  console.log('post data 2', post);

  if (!post.postsToPhotos?.at(0)) {
    return null;
  }

  const exif: TExifData = {
    make: post.postsToPhotos.at(0)!.photo.make!,
    model: post.postsToPhotos.at(0)!.photo.model!,
    lensModel: post.postsToPhotos.at(0)!.photo.lensModel!,
    focalLength: post.postsToPhotos.at(0)!.photo.focalLength!,
    focalLength35mm: post.postsToPhotos.at(0)!.photo.focalLength35mm!,
    fNumber: post.postsToPhotos.at(0)!.photo.fNumber!,
    iso: post.postsToPhotos.at(0)!.photo.iso!,
    exposureTime: post.postsToPhotos.at(0)!.photo.exposureTime!,
    exposureCompensation: post.postsToPhotos.at(0)!.photo.exposureCompensation!,
    dateTimeOriginal: post.postsToPhotos.at(0)!.photo.dateTimeOriginal!,
  };

  const hasAnyExifValue = Object.values(exif).some(
    (value) => value !== undefined && value !== null,
  );

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className='bg-transparent border-none max-w-[calc(100%-2rem)]! w-full shadow-none max-h-[calc(100%-2rem)]!'
      >
        <div className='flex rounded-sm overflow-hidden  w-full h-full min-h-0 min-w-0'>
          <div className='bg-background p-3 w-13/16 relative group'>
            <Image
              src={keyToUrl(post.postsToPhotos?.at(0)!.photo.url)}
              alt={post.title}
              width={post.postsToPhotos?.at(0)!.photo.width}
              height={post.postsToPhotos?.at(0)!.photo.height}
              className='max-w-full max-h-full object-contain'
            />
            <Button
              size='icon-lg'
              asChild
              className='absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100'
              variant='outline'
            >
              <Link
                target='_blank'
                href={keyToUrl(post.postsToPhotos?.at(0)!.photo.url)}
              >
                <IconArrowsMaximize />
              </Link>
            </Button>
          </div>
          <div className='h-full bg-background/95  backdrop-blur-xl w-3/16 flex flex-col justify-between'>
            <div>
              <div className='flex items-center justify-between border-b p-3 gap-1'>
                <Author size='sm' />
                <DialogClose asChild>
                  <Button
                    variant='ghost'
                    className='cursor-pointer'
                    size='icon-sm'
                  >
                    <IconX />
                  </Button>
                </DialogClose>
              </div>
              <div className='p-3'>
                <p>{post.title}</p>
                <p className='text-xs text-muted-foreground'>
                  {format(post.createdAt, 'dd.MM.yyyy')}
                </p>
              </div>
            </div>
            {hasAnyExifValue && (
              <div className='p-3 border-t'>
                <ExifPreview exif={exif} showLogo={false} size='sm' />
              </div>
            )}
          </div>
        </div>

        <DialogTitle className='hidden'>{post.title}</DialogTitle>
      </DialogContent>
    </Dialog>
  );
};

export const LoadingState = () => {
  const aspectRatio = 3 / 2;
  const containerWidth = `min(65vh * ${aspectRatio}, 90vw)`;

  return (
    <div className='h-screen flex justify-center items-center relative overflow-hidden bg-background'>
      <div className='absolute inset-0 -z-10'>
        <div className='absolute inset-0 bg-muted blur-2xl scale-110' />
        <div className='absolute inset-0 bg-background/40' />
      </div>

      <div className='flex justify-center pb-14 w-full'>
        <div
          className='bg-background relative shadow-2xl rounded-lg w-full border'
          style={{
            maxWidth: containerWidth,
            aspectRatio: aspectRatio,
            maxHeight: '65dvh',
          }}
        >
          <Skeleton className='w-full h-full rounded-lg' />

          <div className='absolute -bottom-12 left-0 px-6 py-3 w-full bg-background flex justify-between items-center select-none shadow-md rounded-b-lg border-t'>
            <div className='flex flex-col text-center gap-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-3 w-40' />
            </div>

            <div className='flex items-center gap-2'>
              <Skeleton className='h-8 w-8 rounded-full' />
              <div className='hidden sm:flex flex-col gap-2'>
                <Skeleton className='h-4 w-48' />
                <Skeleton className='h-3 w-28' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
