import { type PostWithPhotos } from '@/db/schema';
import Link from 'next/link';
import BlurImage from '@/components/blur-image';
import { createPreview, formatRelativeCustom } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useId, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/keyboard';
import { Button } from '@/components/ui/button';
import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconLibraryPhoto,
  IconPhoto,
  IconTextSize,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import clsx from 'clsx';

const POST_TYPE_INFO = {
  PHOTO: {
    icon: IconPhoto,
    displayString: 'Foto',
    actionString: 'Foto ansehen',
  },
  ALBUM: {
    icon: IconLibraryPhoto,
    displayString: 'Album',
    actionString: 'Album ansehen',
  },
  ARTICLE: {
    icon: IconTextSize,
    displayString: 'Artikel',
    actionString: 'Artikel lesen',
  },
} as const;

interface PostCardProps {
  post: PostWithPhotos;
  className?: string;
  index?: number;
}

export const PostCard = ({ post, className, index = 0 }: PostCardProps) => {
  const isMobile = useIsMobile();
  const isArticle = post.type === 'ARTICLE';
  const PostTypeIcon = POST_TYPE_INFO[post.type].icon;
  const postTypeDisplayString = POST_TYPE_INFO[post.type].displayString;
  const postTypeActionString = POST_TYPE_INFO[post.type].actionString;

  const href = isArticle
    ? `/article/${post.slug}`
    : post.type === 'PHOTO'
      ? `/photo/${post.slug}`
      : `/album/${post.slug}`;

  const ContentWrapper = !isMobile ? Link : 'div';
  const isPriority = index < 3;

  return (
    <div
      className={cn(
        'bg-background lg:aspect-[0.8] md:hover:bg-muted-foreground/5 transition-colors duration-500 flex flex-col group/card',
        className,
      )}
    >
      {/* Mobile Header */}
      {isMobile && (
        <div className='p-3 pt-6 md:hidden flex gap-2 items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='size-9 bg-muted rounded-full flex justify-center items-center'>
              <PostTypeIcon className='size-4.5!' />
            </div>
            <span className='block text-sm font-medium whitespace-nowrap'>
              {postTypeDisplayString}
            </span>
          </div>
          {/* <Author size='sm' /> */}
          <p className='text-xs uppercase text-muted-foreground font-mono'>
            {formatRelativeCustom(post.createdAt)}
          </p>
        </div>
      )}

      <div className='flex-1 min-h-0 relative aspect-[0.8]'>
        {/* Open Badge */}
        <Badge
          variant='default'
          className='hidden md:flex absolute bottom-1/2 translate-y-full left-1/2 -translate-x-1/2 z-20 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity pointer-events-none text-[0.85rem]! uppercase tracking-widest gap-1.5 px-3 py-2 bg-foreground/90 backdrop-blur-sm border-foreground  shadow-2xl duration-500'
        >
          {postTypeActionString}
        </Badge>

        {/* Type Badge */}
        {(post.type === 'ALBUM' || post.type === 'ARTICLE') && (
          <Badge
            variant='secondary'
            className={clsx(
              'hidden md:flex absolute top-4 right-4 z-20 pointer-events-none  px-2.5 py-1.5 bg-background/80 backdrop-blur-sm  shadow-sm border border-foreground/40',
              isArticle && 'bg-foreground/80 text-background',
            )}
          >
            <PostTypeIcon className='size-4.5!' />
          </Badge>
        )}

        {isArticle ? (
          <ContentWrapper href={href} className='block h-full relative'>
            <ArticleContent post={post} priority={isPriority} />
            <div className='hidden md:flex md:opacity-0 md:group-hover/card:opacity-100 transition-opacity duration-500 absolute inset-0 bg-linear-to-b from-background/0 to-background/95 to-60% xl:to-80% from-40% flex-col justify-end'>
              <div className='xl:p-12 p-8'>
                <p className='text-xl xl:text-2xl tracking-tight leading-snug font-medium block max-w-xl mb-2 line-clamp-2'>
                  {post.title}
                </p>
                <p className='text-base line-clamp-3 text-foreground/70  max-w-lg'>
                  {createPreview(post.content)}
                </p>
              </div>
            </div>
          </ContentWrapper>
        ) : (
          <MediaContent
            post={post}
            href={href}
            isMobile={isMobile}
            priority={isPriority}
          />
        )}
      </div>

      {/* Mobile Footer Non Article */}
      {isMobile && !isArticle && (
        <div className='p-3 pt-5 pb-6 md:hidden flex gap-2 flex-col w-full'>
          <p className='text-sm line-clamp-3  block max-w-xl pr-2 w-full'>
            {post.title}
          </p>
          <a
            className='text-xs underline flex items-center gap-1 text-foreground/70'
            href={href}
          >
            Mehr Details <IconArrowUpRight className='size-3.5' />
          </a>
        </div>
      )}
      {/* Mobile Footer Article */}
      {isMobile && isArticle && (
        <div className='p-3 pb-6 md:hidden flex gap-2 flex-col w-full '>
          <p className='text-lg tracking-tight leading-snug font-medium block max-w-xl'>
            {post.title}
          </p>
          <p className='text-sm line-clamp-3 text-foreground/70 -mt-0.5 max-w-lg'>
            {createPreview(post.content)}
          </p>

          <Button variant='outline' className='text-xs  gap-1  mt-2' asChild>
            <Link href={href}>
              Weiterlesen
              <IconArrowUpRight className='size-3.5' />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

const ArticleContent = ({
  post,
  priority,
}: {
  post: PostWithPhotos;
  priority: boolean;
}) => {
  if (post.coverImage && post.coverImage.length > 0) {
    const aspectRatio =
      post.coverImageWidth && post.coverImageHeight
        ? post.coverImageWidth / post.coverImageHeight
        : undefined;

    return (
      <div className='h-full p-3 relative'>
        <BlurImage
          src={keyToUrl(post.coverImage)}
          alt={post.title}
          fill
          priority={priority}
          sizes='(max-width: 768px) calc(100vw - 1.5rem), (max-width: 1024px) calc(50vw - 1.5rem), calc(33vw - 1.5rem)'
          className='object-contain p-3'
          blurhash={post.coverImageBlurData!}
          aspectRatio={aspectRatio}
        />
      </div>
    );
  }

  return (
    <div className='h-full p-3 flex justify-center items-center'>
      <div className='from-muted from-25% to-foreground/30 bg-linear-to-br  h-full flex items-center justify-center p-8 text-center font-medium aspect-[0.66667]'>
        <span className=''>{post.title}</span>
      </div>
    </div>
  );
};

const MediaContent = ({
  post,
  href,
  isMobile,
  priority,
}: {
  post: PostWithPhotos;
  href: string;
  isMobile: boolean;
  priority: boolean;
}) => {
  const photos = post.postsToPhotos || [];
  const firstPhoto = photos[0]?.photo;

  const [shouldRenderSwiper, setShouldRenderSwiper] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const uniquePagination = useId();

  useEffect(() => {
    if (!isMobile || post.type !== 'ALBUM' || photos.length <= 1) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRenderSwiper(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }, // Start loading when 300px away
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isMobile, post.type, photos.length]);

  if (!firstPhoto) return null;

  const sizes =
    '(max-width: 768px) calc(100vw - 1.5rem), (max-width: 1024px) calc(50vw - 1.5rem), calc(33vw - 1.5rem)';

  if (isMobile) {
    if (post.type === 'ALBUM' && photos.length > 1) {
      return (
        <div
          id='album-swiper-mobile-feed'
          ref={containerRef}
          className='h-full w-full relative'
        >
          {shouldRenderSwiper ? (
            <>
              <Swiper
                modules={[Navigation, Pagination, Keyboard]}
                slidesPerView={1}
                autoHeight={false}
                loop
                keyboard={{ enabled: true }}
                navigation={{
                  prevEl: '#album-swiper-prev',
                  nextEl: '#album-swiper-next',
                }}
                pagination={{
                  el: `#album-swiper-pagination-${uniquePagination}`,
                  clickable: true,
                }}
                className='h-full w-full'
              >
                {photos.map((ptp, i) => (
                  <SwiperSlide
                    key={ptp.photo.id}
                    className='p-3 h-full relative'
                  >
                    <BlurImage
                      src={keyToUrl(ptp.photo.url)}
                      alt={ptp.photo.title ?? `${post.title} - ${i + 1}`}
                      fill
                      priority={priority && i === 0}
                      sizes={sizes}
                      blurhash={ptp.photo.blurData}
                      aspectRatio={ptp.photo.aspectRatio ?? undefined}
                      className='object-contain p-3'
                    />
                  </SwiperSlide>
                ))}
                <Button
                  id='album-swiper-prev'
                  size='icon-sm'
                  className='absolute top-1/2 left-1 -translate-y-1/2  z-10 cursor-pointer bg-background/50  backdrop-blur-sm border-none'
                  variant='outline'
                >
                  <IconArrowLeft />
                </Button>
                <Button
                  id='album-swiper-next'
                  size='icon-sm'
                  className='absolute top-1/2 right-1 -translate-y-1/2  z-10 cursor-pointer bg-background/50  backdrop-blur-sm border-none'
                  variant='outline'
                >
                  <IconArrowRight />
                </Button>
              </Swiper>
              <div
                id={`album-swiper-pagination-${uniquePagination}`}
                className='album-swiper-pagination'
              />
            </>
          ) : (
            <div className='h-full w-full p-3 relative'>
              <BlurImage
                src={keyToUrl(firstPhoto.url)}
                alt={firstPhoto.title ?? post.title}
                fill
                priority={priority}
                sizes={sizes}
                blurhash={firstPhoto.blurData}
                aspectRatio={firstPhoto.aspectRatio ?? undefined}
                className='object-contain p-3'
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <a href={href} className='h-full w-full p-3 relative block'>
        <BlurImage
          src={keyToUrl(firstPhoto.url)}
          alt={firstPhoto.title ?? post.title}
          fill
          priority={priority}
          sizes={sizes}
          blurhash={firstPhoto.blurData}
          aspectRatio={firstPhoto.aspectRatio ?? undefined}
          className='object-contain p-3'
        />
      </a>
    );
  }

  // Desktop view: Link to modal with hover preview for albums
  return (
    <Link className='block h-full p-3 relative group' href={href}>
      <BlurImage
        src={keyToUrl(firstPhoto.url)}
        alt={firstPhoto.title ?? post.title}
        fill
        priority={priority}
        sizes={sizes}
        blurhash={firstPhoto.blurData}
        aspectRatio={firstPhoto.aspectRatio ?? undefined}
        className='object-contain p-3 transition-opacity duration-300'
      />
    </Link>
  );
};
