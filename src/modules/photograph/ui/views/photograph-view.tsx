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
import { Photo } from '@/db/schema';
import { de } from 'date-fns/locale';
import BlurImage from '@/components/blur-image';
import { SocialInteractions } from '@/modules/social/ui/components/social-interactions';
import { FeedPreviewSkeleton } from '@/modules/home/ui/components/feed-preview';

// --- Types ---

interface PhotographViewProps {
  post: PostGetOne;
  isModal?: boolean;
}

// --- Helper Functions ---

const getExifFromPhoto = (photo?: Photo | null): TExifData => ({
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
        'flex flex-col backdrop-blur-xl min-h-0',
        isModal
          ? 'h-full bg-background/95 w-5/16 lg:w-4/16 xl:w-3/16'
          : 'bg-muted/50 w-full md:w-5/16 lg:w-4/16 xl:w-3/16 h-full',
      )}
    >
      <div className='flex flex-col h-full'>
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
        <div className='p-3 border-b bg-muted/20'>
          <p className='font-medium text-lg leading-tight tracking-tight mb-1'>
            {post.title}
          </p>
          <p className='text-sm text-muted-foreground'>
            {format(post.createdAt, 'dd.MM.yyyy, p', { locale: de })}
          </p>
        </div>

        {/* SOCIAL INTERACTIONS AREA */}
        <div className='grow min-h-0 p-3 '>
          <SocialInteractions postId={post.id} />
        </div>

        {showExif && hasExif && (
          <div className='p-3 border-t bg-muted/10'>
            <ExifPreview exif={exif} showLogo={false} size='sm' />
          </div>
        )}
      </div>
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
  const currentPhoto = photos[activeIndex]?.photo ?? photos[0]?.photo;

  return (
    <div
      className={cn(
        'bg-background p-3 relative group flex items-center justify-center',
        isModal
          ? 'w-11/16 lg:w-12/16 xl:w-13/16 h-full'
          : 'w-full md:w-11/16 lg:w-12/16 xl:w-13/16 min-h-[50vh] h-full',
      )}
    >
      {isAlbum ? (
        <>
          <Swiper
            id='album-swiper-modal'
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
                <BlurImage
                  src={keyToUrl(ptp.photo.url)}
                  alt={title}
                  width={ptp.photo.width}
                  height={ptp.photo.height}
                  className='max-w-full max-h-full w-full h-full object-contain'
                  blurhash={ptp.photo.blurData}
                  aspectRatio={ptp.photo.aspectRatio}
                  priority={i === 0}
                  sizes='(max-width: 1024px) 100vw, 80vw'
                />
              </SwiperSlide>
            ))}
            <Button
              id='album-swiper-prev'
              size='icon-sm'
              className='absolute top-1/2 left-1 -translate-y-1/2 z-10 bg-background/50 backdrop-blur-sm border-none'
              variant='outline'
              aria-label='Vorheriges Foto'
            >
              <IconArrowLeft />
            </Button>
            <Button
              id='album-swiper-next'
              size='icon-sm'
              className='absolute top-1/2 right-1 -translate-y-1/2 z-10 bg-background/50 backdrop-blur-sm border-none'
              variant='outline'
              aria-label='Nächstes Foto'
            >
              <IconArrowRight />
            </Button>
            <div id='album-swiper-pagination' />
          </Swiper>
          {currentPhoto && (
            <Button
              size='icon-sm'
              asChild
              className='absolute top-3 right-3 opacity-0 group-hover:opacity-100 z-10'
              variant='outline'
            >
              <Link target='_blank' href={keyToUrl(currentPhoto.url)}>
                <IconArrowsMaximize />
              </Link>
            </Button>
          )}
        </>
      ) : photos[0]?.photo ? (
        <div className='flex items-center justify-center w-full h-full relative'>
          <BlurImage
            src={keyToUrl(photos[0].photo.url)}
            alt={title}
            width={photos[0].photo.width}
            height={photos[0].photo.height}
            className='max-w-full max-h-full object-contain'
            blurhash={photos[0].photo.blurData}
            aspectRatio={photos[0].photo.aspectRatio}
            sizes='(max-width: 1024px) 100vw, 80vw'
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
      ) : null}
    </div>
  );
};

const MobileMediaList = ({
  post,
  photos,
  title,
}: {
  post: PostGetOne;
  photos: { photo: Photo }[];
  title: string;
}) => (
  <div className='bg-background p-3 relative group flex flex-col w-full'>
    {photos.map(
      (ptp, i) =>
        ptp && (
          <div key={ptp.photo.id} className='mt-6 relative'>
            <div
              className='relative w-full overflow-hidden'
              style={{
                aspectRatio: ptp.photo.aspectRatio
                  ? `${ptp.photo.aspectRatio}`
                  : ptp.photo.width && ptp.photo.height
                    ? `${ptp.photo.width} / ${ptp.photo.height}`
                    : '3 / 2',
              }}
            >
              <BlurImage
                src={keyToUrl(ptp.photo.url)}
                alt={title}
                width={ptp.photo.width}
                height={ptp.photo.height}
                className='max-w-full w-full h-full object-contain max-h-screen'
                priority={i === 0}
                blurhash={ptp.photo.blurData}
                aspectRatio={ptp.photo.aspectRatio}
                sizes='100vw'
              />
              <Button
                size='icon-sm'
                asChild
                className='absolute top-1.5 right-1.5 bg-background/60 border-none backdrop-blur-md size-7 z-10'
                variant='outline'
              >
                <Link target='_blank' href={keyToUrl(ptp.photo.url)}>
                  <IconArrowsMaximize className='size-3.5!' />
                </Link>
              </Button>
            </div>
            {ptp.photo.make && (
              <div className='p-3 bg-muted/50'>
                <ExifPreview
                  exif={getExifFromPhoto(ptp.photo)}
                  showLogo={false}
                  size='sm'
                />
              </div>
            )}
          </div>
        ),
    )}
    <div className='mt-8 border-t pt-6'>
      <SocialInteractions postId={post.id} />
    </div>
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

  const handleOpenChange = (openState: boolean) => {
    if (openState === false) router.back();
    setIsModalOpen(openState);
  };

  const photos = useMemo(() => {
    if (post.postsToPhotos && post.postsToPhotos.length > 0) {
      return post.postsToPhotos;
    }
    if (post.coverImage) {
      return [
        {
          postId: post.id,
          photoId: post.id,
          sortOrder: 0,
          photo: {
            id: post.id,
            url: post.coverImage,
            title: post.title,
            aspectRatio: 1,
            width: 1200,
            height: 800,
            blurData: '',
            make: null,
            model: null,
            lensModel: null,
            focalLength: null,
            focalLength35mm: null,
            fNumber: null,
            iso: null,
            exposureTime: null,
            exposureCompensation: null,
            latitude: null,
            longitude: null,
            gpsAltitude: null,
            dateTimeOriginal: post.createdAt,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
          },
        },
      ];
    }
    return [];
  }, [post]);

  const currentPhoto = useMemo(() => {
    if (!photos || photos.length === 0) return null;
    const safeIndex =
      swiperActiveIndex >= 0 && swiperActiveIndex < photos.length
        ? swiperActiveIndex
        : 0;
    return photos[safeIndex]?.photo ?? null;
  }, [photos, swiperActiveIndex]);

  const currentExif = useMemo(
    () => getExifFromPhoto(currentPhoto),
    [currentPhoto],
  );

  if (photos.length === 0) return null;

  if (!isModal) {
    return (
      <div className='w-full'>
        {/* Mobile View */}
        <div className='flex overflow-hidden min-h-0 min-w-0 flex-col mt-12 -mx-3 md:hidden'>
          <div className='px-3 border-b pb-4'>
            <PhotoInfo
              post={post}
              exif={currentExif}
              isModal={false}
              showExif={false}
            />
          </div>
          <MobileMediaList post={post} photos={photos} title={post.title} />
        </div>

        {/* Desktop View */}
        <div className='hidden md:flex overflow-hidden min-h-0 min-w-0 flex-row w-full border border-border/50 md:h-[calc(100vh-12rem)] max-h-[calc(100vh-5rem)] mt-12'>
          <DesktopMedia
            photos={photos}
            title={post.title}
            isModal={false}
            activeIndex={swiperActiveIndex}
            onSlideChange={setSwiperActiveIndex}
          />
          <PhotoInfo
            post={post}
            exif={currentExif}
            isModal={false}
            showExif={true}
          />
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className='bg-transparent border-none max-w-[calc(100%-2rem)]! w-full shadow-none h-full max-h-[calc(100%-2rem)]!'
      >
        <div className='flex overflow-hidden min-h-0 min-w-0 rounded-sm w-full h-full'>
          <DesktopMedia
            photos={photos}
            title={post.title}
            isModal={true}
            activeIndex={swiperActiveIndex}
            onSlideChange={setSwiperActiveIndex}
          />
          <PhotoInfo
            post={post}
            exif={currentExif}
            isModal={true}
            showExif={true}
          />
        </div>
        <DialogTitle className='hidden'>{post.title}</DialogTitle>
      </DialogContent>
    </Dialog>
  );
};

export const LoadingState = ({ isModal = false }: { isModal?: boolean } = {}) => {
  return (
    <div className='w-full'>
      {/* Mobile Skeleton Layout */}
      <div className='flex overflow-hidden min-h-0 min-w-0 flex-col mt-12 -mx-3 md:hidden'>
        <div className='px-3 border-b pb-4'>
          <div className='flex flex-col h-full bg-muted/50 w-full'>
            {/* Author bar */}
            <div className='flex items-center justify-between border-b p-3 gap-1'>
              <div className='flex items-center gap-2'>
                <Skeleton className='size-8 rounded-full' />
                <Skeleton className='h-4 w-28' />
              </div>
            </div>

            {/* Title & Date */}
            <div className='p-3 border-b bg-muted/20'>
              <Skeleton className='h-6 w-3/4 mb-1' />
              <Skeleton className='h-3.5 w-32' />
            </div>

            {/* Social Interactions (Top) */}
            <div className='p-3 space-y-4'>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-1.5'>
                  <Skeleton className='size-6 rounded-full' />
                  <Skeleton className='h-4 w-6 rounded-xs' />
                </div>
                <div className='flex items-center gap-1.5'>
                  <Skeleton className='size-6 rounded-full' />
                  <Skeleton className='h-4 w-6 rounded-xs' />
                </div>
              </div>
              <div className='pt-2 border-t space-y-2'>
                <Skeleton className='h-3 w-36' />
                <div className='relative flex items-end gap-2'>
                  <Skeleton className='h-10 flex-1 rounded-md' />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Media List Skeleton */}
        <div className='bg-background p-3 relative flex flex-col w-full'>
          {[0, 1].map((index) => (
            <div key={index} className='mt-6 relative'>
              <div className='relative w-full aspect-[3/2] overflow-hidden'>
                <Skeleton className='w-full h-full rounded-none' />
                <Skeleton className='absolute top-1.5 right-1.5 size-7 rounded-md' />
              </div>
              <div className='p-3 bg-muted/50 space-y-1.5'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3.5 w-24' />
                </div>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-3 w-48 font-mono' />
                  <Skeleton className='h-3 w-20' />
                </div>
              </div>
            </div>
          ))}

          {/* Bottom Social Interactions Skeleton */}
          <div className='mt-8 border-t pt-6'>
            <div className='flex flex-col gap-4'>
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-1.5'>
                  <Skeleton className='size-6 rounded-full' />
                  <Skeleton className='h-4 w-6 rounded-xs' />
                </div>
                <div className='flex items-center gap-1.5'>
                  <Skeleton className='size-6 rounded-full' />
                  <Skeleton className='h-4 w-6 rounded-xs' />
                </div>
              </div>
              <div className='pt-2 border-t space-y-2'>
                <Skeleton className='h-3 w-36' />
                <div className='relative flex items-end gap-2'>
                  <Skeleton className='h-10 flex-1 rounded-md' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Skeleton Layout */}
      <div
        className={cn(
          'hidden md:flex overflow-hidden min-h-0 min-w-0',
          isModal
            ? 'rounded-sm w-full h-full'
            : 'flex-col md:flex-row w-full border border-border/50 md:h-[calc(100vh-12rem)] max-h-[calc(100vh-5rem)] mt-12',
        )}
      >
        {/* Left: Media Area */}
        <div className='flex items-center justify-center h-full w-full relative flex-1 min-h-0 min-w-0 bg-background p-8'>
          <Skeleton className='w-full h-full max-h-[70vh] rounded-xs' />
        </div>

        {/* Right: Info Sidebar */}
        <div
          className={cn(
            'flex flex-col backdrop-blur-xl min-h-0 border-l border-border/50',
            isModal
              ? 'h-full bg-background/95 w-5/16 lg:w-4/16 xl:w-3/16'
              : 'bg-muted/50 w-full md:w-5/16 lg:w-4/16 xl:w-3/16 h-full',
          )}
        >
          {/* Author */}
          <div className='flex items-center justify-between border-b p-3 gap-1'>
            <div className='flex items-center gap-2'>
              <Skeleton className='size-8 rounded-full' />
              <Skeleton className='h-4 w-28' />
            </div>
          </div>

          {/* Title & Date */}
          <div className='p-3 border-b bg-muted/20'>
            <Skeleton className='h-6 w-4/5 mb-1' />
            <Skeleton className='h-3.5 w-32' />
          </div>

          {/* Social Interactions */}
          <div className='grow min-h-0 p-3 flex flex-col gap-4'>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-1.5'>
                <Skeleton className='size-6 rounded-full' />
                <Skeleton className='h-4 w-6 rounded-xs' />
              </div>
              <div className='flex items-center gap-1.5'>
                <Skeleton className='size-6 rounded-full' />
                <Skeleton className='h-4 w-6 rounded-xs' />
              </div>
            </div>

            <div className='flex-1 space-y-4 py-2 overflow-hidden'>
              <div className='flex flex-col gap-1.5'>
                <div className='flex items-center justify-between'>
                  <Skeleton className='h-3.5 w-24' />
                  <Skeleton className='h-2.5 w-16' />
                </div>
                <Skeleton className='h-3.5 w-4/5' />
              </div>
              <div className='flex flex-col gap-1.5'>
                <div className='flex items-center justify-between'>
                  <Skeleton className='h-3.5 w-20' />
                  <Skeleton className='h-2.5 w-14' />
                </div>
                <Skeleton className='h-3.5 w-2/3' />
              </div>
            </div>

            <div className='pt-2 border-t space-y-2 mt-auto'>
              <Skeleton className='h-3 w-36' />
              <div className='relative flex items-end gap-2'>
                <Skeleton className='h-10 flex-1 rounded-md' />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Preview Skeleton (non-modal only) */}
      {!isModal && (
        <div className='mt-4'>
          <FeedPreviewSkeleton limit={3} />
        </div>
      )}
    </div>
  );
};
