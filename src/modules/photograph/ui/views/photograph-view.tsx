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
import { useMemo, useState } from 'react';

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

import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Photo } from '@/db/schema';

// --- Types ---

interface PhotographViewProps {
  post: PostGetOne;
  isModal?: boolean;
}

// --- Helper Functions ---

const getExifFromPhoto = (photo: Photo): TExifData => ({
  make: photo?.make ?? undefined,
  model: photo?.model ?? undefined,
  lensModel: photo?.lensModel ?? undefined,
  focalLength: photo?.focalLength ?? undefined,
  focalLength35mm: photo?.focalLength35mm ?? undefined,
  fNumber: photo?.fNumber ?? undefined,
  iso: photo?.iso ?? undefined,
  exposureTime: photo?.exposureTime ?? undefined,
  exposureCompensation: photo?.exposureCompensation ?? undefined,
  dateTimeOriginal: photo?.dateTimeOriginal ?? undefined,
});

// --- Sub-components ---

const PhotoInfo = ({
  post,
  exif,
  isModal,
  showExif,
}: {
  post: PostGetOne;
  exif: TExifData;
  isModal: boolean;
  showExif: boolean;
}) => {
  const hasExif = Object.values(exif).some(
    (v) => v !== undefined && v !== null,
  );

  return (
    <div
      className={cn(
        'flex flex-col justify-between backdrop-blur-xl',
        isModal
          ? 'h-full bg-background/95 w-3/16'
          : 'bg-muted/50 w-full md:w-3/16',
      )}
    >
      <div>
        <div className='flex items-center justify-between border-b p-3 gap-1'>
          <Author size='sm' />
          {isModal && (
            <DialogClose asChild>
              <Button variant='ghost' size='icon-sm'>
                <IconX />
              </Button>
            </DialogClose>
          )}
        </div>
        <div className='p-3'>
          <p className='font-medium'>{post.title}</p>
          <p className='text-xs text-muted-foreground'>
            {format(post.createdAt, 'dd.MM.yyyy')}
          </p>
        </div>
      </div>
      {showExif && hasExif && (
        <div className='p-3 border-t'>
          <ExifPreview exif={exif} showLogo={false} size='sm' />
        </div>
      )}
    </div>
  );
};

const DesktopMedia = ({
  photos,
  title,
  isModal,
  onSlideChange,
  activeIndex,
}: {
  photos: { photo: Photo }[];
  title: string;
  isModal: boolean;
  onSlideChange: (index: number) => void;
  activeIndex: number;
}) => {
  const isAlbum = photos.length > 1;

  return (
    <div
      className={cn(
        'bg-background p-3 relative group flex items-center justify-center',
        isModal ? 'w-13/16 h-full' : 'w-full md:w-13/16 min-h-[50vh]',
      )}
    >
      {isAlbum ? (
        <>
          <Swiper
            id='album-swiper'
            modules={[Navigation, Pagination, Keyboard]}
            slidesPerView={1}
            onSlideChange={(s) => onSlideChange(s.realIndex)}
            loop
            className='w-full h-full'
            keyboard={{ enabled: true }}
            navigation={{
              prevEl: '#album-swiper-prev',
              nextEl: '#album-swiper-next',
            }}
            pagination={{ el: '#album-swiper-pagination', clickable: true }}
          >
            {photos.map((ptp, i) => (
              <SwiperSlide
                key={ptp.photo.id}
                className='h-full flex items-center justify-center cursor-ew-resize'
              >
                <Image
                  src={keyToUrl(ptp.photo.url)}
                  alt={title}
                  width={ptp.photo.width}
                  height={ptp.photo.height}
                  className='max-w-full max-h-full w-full h-full object-contain'
                  priority={i === 0}
                />
              </SwiperSlide>
            ))}
            <Button
              id='album-swiper-prev'
              size='icon-sm'
              className='absolute top-1/2 left-1 -translate-y-1/2 z-10 bg-background/50 backdrop-blur-sm border-none'
              variant='outline'
            >
              <IconArrowLeft />
            </Button>
            <Button
              id='album-swiper-next'
              size='icon-sm'
              className='absolute top-1/2 right-1 -translate-y-1/2 z-10 bg-background/50 backdrop-blur-sm border-none'
              variant='outline'
            >
              <IconArrowRight />
            </Button>
            <div id='album-swiper-pagination' />
          </Swiper>
          <Button
            size='icon-sm'
            asChild
            className='absolute top-3 right-3 opacity-0 group-hover:opacity-100 z-10'
            variant='outline'
          >
            <Link
              target='_blank'
              href={keyToUrl(photos[activeIndex].photo.url)}
            >
              <IconArrowsMaximize />
            </Link>
          </Button>
        </>
      ) : (
        <div className='flex items-center justify-center w-full h-full relative'>
          <Image
            src={keyToUrl(photos[0].photo.url)}
            alt={title}
            width={photos[0].photo.width}
            height={photos[0].photo.height}
            className='max-w-full max-h-full object-contain'
            priority
          />
          <Button
            size='icon-sm'
            asChild
            className='absolute top-3 right-3 opacity-0 group-hover:opacity-100'
            variant='outline'
          >
            <Link target='_blank' href={keyToUrl(photos[0].photo.url)}>
              <IconArrowsMaximize />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

const MobileMediaList = ({
  photos,
  title,
}: {
  photos: { photo: Photo }[];
  title: string;
}) => (
  <div className='bg-background p-3 relative group flex flex-col w-full'>
    {photos.map(
      (ptp, i) =>
        ptp && (
          <div key={ptp.photo.id} className='mt-6 relative'>
            <Image
              src={keyToUrl(ptp.photo.url)}
              alt={title}
              width={ptp.photo.width}
              height={ptp.photo.height}
              className='max-w-full w-full h-full object-contain max-h-screen'
              priority={i === 0}
            />
            {ptp.photo.make && (
              <div className='p-3 bg-muted/50'>
                <ExifPreview
                  exif={getExifFromPhoto(ptp.photo)}
                  showLogo={false}
                  size='sm'
                />
              </div>
            )}
            <Button
              size='icon-sm'
              asChild
              className='absolute top-1.5 right-1.5 bg-background/60 border-none backdrop-blur-md size-7'
              variant='outline'
            >
              <Link target='_blank' href={keyToUrl(ptp.photo.url)}>
                <IconArrowsMaximize className='size-3.5!' />
              </Link>
            </Button>
          </div>
        ),
    )}
  </div>
);

// --- Main Component ---

export const PhotographView = ({
  post,
  isModal = true,
}: PhotographViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [swiperActiveIndex, setSwiperActiveIndex] = useState<number>(0);
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleOpenChange = (openState: boolean) => {
    if (openState === false) router.back();
    setIsModalOpen(openState);
  };

  const currentExif = useMemo(
    () => getExifFromPhoto(post.postsToPhotos!.at(swiperActiveIndex)!.photo!),
    [post.postsToPhotos, swiperActiveIndex],
  );

  if (!post.postsToPhotos?.at(0)) return null;

  const photos = post.postsToPhotos;

  const content =
    isMobile && !isModal ? (
      <div className='flex overflow-hidden min-h-0 min-w-0 flex-col mt-12 -mx-3'>
        <PhotoInfo
          post={post}
          exif={currentExif}
          isModal={false}
          showExif={false}
        />
        <MobileMediaList photos={photos} title={post.title} />
      </div>
    ) : (
      <div
        className={cn(
          'flex overflow-hidden min-h-0 min-w-0',
          isModal
            ? 'rounded-sm w-full h-full'
            : 'flex-col md:flex-row w-full border border-border/50 max-h-[calc(100vh-5rem)] mt-12',
        )}
      >
        <DesktopMedia
          photos={photos}
          title={post.title}
          isModal={isModal}
          activeIndex={swiperActiveIndex}
          onSlideChange={setSwiperActiveIndex}
        />
        <PhotoInfo
          post={post}
          exif={currentExif}
          isModal={isModal}
          showExif={!isMobile}
        />
      </div>
    );

  if (!isModal) return content;

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className='bg-transparent border-none max-w-[calc(100%-2rem)]! w-full shadow-none h-full max-h-[calc(100%-2rem)]!'
      >
        {content}
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
