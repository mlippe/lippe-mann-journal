import { type PostWithPhotos } from '@/db/schema';
import Image from 'next/image';
import Link from 'next/link';
import Author from '@/components/author';
import BlurImage from '@/components/blur-image';
import { formatRelativeCustom } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useRef, useState } from 'react';
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
  IconBook,
  IconPhoto,
  IconPhotoStar,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';

interface PostCardProps {
  post: PostWithPhotos;
  className?: string;
  index?: number;
}

const TYPE_CONFIG = {
  PHOTO: {
    label: 'Photo',
    icon: IconPhoto,
  },
  ALBUM: {
    label: 'Album',
    icon: IconPhotoStar,
  },
  ARTICLE: {
    label: 'Article',
    icon: IconBook,
  },
} as const;

export const PostCard = ({ post, className, index = 0 }: PostCardProps) => {
  const isMobile = useIsMobile();
  const isArticle = post.type === 'ARTICLE';

  const typeConfig = TYPE_CONFIG[post.type];
  const TypeIcon = typeConfig.icon;

  // Only articles navigate on mobile. Everything navigates on desktop.
  const shouldNavigate = !isMobile || isArticle;
  const href = isArticle
    ? `/article/${post.slug}`
    : post.type === 'PHOTO'
      ? `/photo/${post.slug}`
      : `/album/${post.slug}`;

  const ContentWrapper = shouldNavigate ? Link : 'div';
  const isPriority = index < 3;

  return (
    <div
      className={cn(
        'bg-background aspect-[0.8] md:hover:bg-muted-foreground/5 transition-colors duration-500 flex flex-col group/card',
        className,
      )}
    >
      {/* Mobile Header */}
      {isMobile && (
        <div className='p-3 pt-6 md:hidden flex gap-2 items-center justify-between'>
          <Author size='sm' />
          <p className='text-xs uppercase text-muted-foreground font-mono'>
            {formatRelativeCustom(post.createdAt)}
          </p>
        </div>
      )}

      <div className='flex-1 min-h-0 relative'>
        {/* Type Badge */}
        <Badge
          variant='default'
          className='hidden md:flex absolute top-4 left-4 z-20 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity pointer-events-none text-[10px] uppercase tracking-widest gap-1.5 px-2 py-1 bg-foreground/90 backdrop-blur-sm border-foreground  shadow-sm duration-500'
        >
          <TypeIcon size={12} className='text-background' />
          {typeConfig.label}
        </Badge>

        {isArticle ? (
          <ContentWrapper href={href} className='block h-full'>
            <ArticleContent post={post} priority={isPriority} />
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

      {/* Mobile Footer */}
      {isMobile && (
        <div className='p-3 pb-6 md:hidden flex gap-3 items-start'>
          <Badge
            variant='secondary'
            className='text-[10px] uppercase tracking-widest gap-1.5 px-2 py-1 bg-background/80 backdrop-blur-sm border-none shadow-sm'
          >
            <TypeIcon size={12} className='text-muted-foreground' />
            {typeConfig.label}
          </Badge>
          <span className='text-sm line-clamp-3 font-medium mt-0.5'>
            {post.title}
          </span>
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
    return (
      <div className='h-full p-3 relative'>
        <Image
          src={keyToUrl(post.coverImage)}
          alt={post.title}
          fill
          priority={priority}
          sizes='(max-width: 768px) calc(100vw - 1.5rem), (max-width: 1024px) calc(50vw - 1.5rem), calc(33vw - 1.5rem)'
          className='object-contain p-3'
        />
      </div>
    );
  }

  return (
    <div className='h-full p-3'>
      <div className='bg-muted h-full flex items-center justify-center p-8 text-center font-medium'>
        {post.title}
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
        <div ref={containerRef} className='h-full w-full'>
          {shouldRenderSwiper ? (
            <Swiper
              id='album-swiper'
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
                el: '#album-swiper-pagination',
                clickable: true,
              }}
              className='h-full w-full'
            >
              {photos.map((ptp, i) => (
                <SwiperSlide key={ptp.photo.id} className='p-3 h-full relative'>
                  <BlurImage
                    src={keyToUrl(ptp.photo.url)}
                    alt={ptp.photo.title ?? `${post.title} - ${i + 1}`}
                    fill
                    priority={priority && i === 0}
                    sizes={sizes}
                    blurhash={ptp.photo.blurData}
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
              <div id='album-swiper-pagination' />
            </Swiper>
          ) : (
            <div className='h-full w-full p-3 relative'>
              <BlurImage
                src={keyToUrl(firstPhoto.url)}
                alt={firstPhoto.title ?? post.title}
                fill
                priority={priority}
                sizes={sizes}
                blurhash={firstPhoto.blurData}
                className='object-contain p-3'
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className='h-full w-full p-3 relative'>
        <BlurImage
          src={keyToUrl(firstPhoto.url)}
          alt={firstPhoto.title ?? post.title}
          fill
          priority={priority}
          sizes={sizes}
          blurhash={firstPhoto.blurData}
          className='object-contain p-3'
        />
      </div>
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
        className='object-contain p-3 transition-opacity duration-300'
      />
    </Link>
  );
};
