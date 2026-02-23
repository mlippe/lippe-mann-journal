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
import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowsMaximize,
  IconX,
} from '@tabler/icons-react';
import Link from 'next/link';

import { PostGetOne } from '@/modules/posts/types';
import Author from '@/components/author';
import { format } from 'date-fns';
import { ExifPreview } from '@/modules/photos/ui/components/exif-preview';
import { TExifData } from '@/modules/photos/lib/utils';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/keyboard';

export const PhotographView = ({
  post,
  isModal = true,
}: {
  post: PostGetOne;
  isModal?: boolean;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const [swiperActiveIndex, setSwiperActiveIndex] = useState<number>(0);

  const exif: TExifData = useMemo(() => {
    const photo = post.postsToPhotos?.at(swiperActiveIndex)?.photo;
    if (!photo) return {};
    return {
      make: photo.make ?? undefined,
      model: photo.model ?? undefined,
      lensModel: photo.lensModel ?? undefined,
      focalLength: photo.focalLength ?? undefined,
      focalLength35mm: photo.focalLength35mm ?? undefined,
      fNumber: photo.fNumber ?? undefined,
      iso: photo.iso ?? undefined,
      exposureTime: photo.exposureTime ?? undefined,
      exposureCompensation: photo.exposureCompensation ?? undefined,
      dateTimeOriginal: photo.dateTimeOriginal ?? undefined,
    };
  }, [post.postsToPhotos, swiperActiveIndex]);

  const hasAnyExifValue = useMemo(
    () =>
      Object.values(exif).some(
        (value) => value !== undefined && value !== null,
      ),
    [exif],
  );

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

  return isModal ? (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className='bg-transparent border-none max-w-[calc(100%-2rem)]! w-full shadow-none h-full max-h-[calc(100%-2rem)]!'
      >
        <div className='flex rounded-sm overflow-hidden w-full h-full min-h-0 min-w-0'>
          <div className='bg-background p-3 w-13/16 relative group flex items-center justify-center h-full'>
            {post.postsToPhotos && post.postsToPhotos.length > 1 ? (
              <>
                <Swiper
                  id='album-swiper'
                  modules={[Navigation, Pagination, Keyboard]}
                  slidesPerView={1}
                  onSlideChange={(active) =>
                    setSwiperActiveIndex(active.realIndex)
                  }
                  autoHeight={false}
                  loop
                  className='min-h-0 w-full h-full'
                  keyboard={{ enabled: true }}
                  navigation={{
                    prevEl: '#album-swiper-prev',
                    nextEl: '#album-swiper-next',
                  }}
                  pagination={{
                    el: '#album-swiper-pagination',
                    clickable: true,
                  }}
                >
                  <Button
                    id='album-swiper-prev'
                    size='icon-sm'
                    className='absolute top-1/2 left-0 -translate-y-1/2  z-10 cursor-pointer'
                    variant='outline'
                  >
                    <IconArrowLeft />
                  </Button>
                  <Button
                    id='album-swiper-next'
                    size='icon-sm'
                    className='absolute top-1/2 right-0 -translate-y-1/2  z-10 cursor-pointer'
                    variant='outline'
                  >
                    <IconArrowRight />
                  </Button>
                  <div id='album-swiper-pagination' />
                  {post.postsToPhotos.map((photo, i) => (
                    <SwiperSlide
                      key={`slide-${i}`}
                      className='h-full flex items-center justify-center cursor-ew-resize'
                    >
                      <Image
                        src={keyToUrl(photo.photo.url)}
                        alt={post.title}
                        width={photo.photo.width}
                        height={photo.photo.height}
                        className='max-w-full max-h-full w-full h-full object-contain'
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <Button
                  size='icon-sm'
                  asChild
                  className='absolute top-3 right-3 opacity-0 group-hover:opacity-100 z-10'
                  variant='outline'
                >
                  <Link
                    target='_blank'
                    href={keyToUrl(
                      post.postsToPhotos?.at(swiperActiveIndex)!.photo.url,
                    )}
                  >
                    <IconArrowsMaximize />
                  </Link>
                </Button>
              </>
            ) : (
              <div className='flex items-center justify-center w-full h-full'>
                <Image
                  src={keyToUrl(post.postsToPhotos?.at(0)!.photo.url)}
                  alt={post.title}
                  width={post.postsToPhotos?.at(0)!.photo.width}
                  height={post.postsToPhotos?.at(0)!.photo.height}
                  className='max-w-full max-h-full object-contain'
                />
                <Button
                  size='icon-sm'
                  asChild
                  className='absolute top-3 right-3 opacity-0 group-hover:opacity-100'
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
            )}
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
  ) : (
    <div className='w-full mt-12 border border-border/50 max-h-screen '>
      <div className='flex  w-full min-h-0 min-w-0 max-h-screen md:flex-row flex-col '>
        <div className='bg-background p-3 md:w-13/16 relative group'>
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
        <div className='bg-muted/50  backdrop-blur-xl md:w-3/16 flex flex-col justify-between'>
          <div>
            <div className='flex items-center justify-between border-b p-3 gap-1'>
              <Author size='sm' />
            </div>
            <div className='p-3'>
              <p>{post.title}</p>
              <p className='text-xs text-muted-foreground'>
                {format(post.createdAt, 'dd.MM.yyyy')}
              </p>
            </div>
          </div>
          {hasAnyExifValue && (
            <div className='p-3 border-t max-w-sm'>
              <ExifPreview exif={exif} showLogo={false} size='sm' />
            </div>
          )}
        </div>
      </div>
    </div>
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
