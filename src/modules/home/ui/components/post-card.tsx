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
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';

interface PostCardProps {
  post: PostWithPhotos;
  className?: string;
}

export const PostCard = ({ post, className }: PostCardProps) => {
  const isMobile = useIsMobile();
  const isMediaPost = post.type === 'PHOTO' || post.type === 'ALBUM';
  const isArticle = post.type === 'ARTICLE';

  // Only articles navigate on mobile. Everything navigates on desktop.
  const shouldNavigate = !isMobile || isArticle;
  const href = isArticle
    ? `/post/${post.slug}`
    : post.type === 'PHOTO'
      ? `/photo/${post.slug}`
      : `/album/${post.slug}`;

  const ContentWrapper = shouldNavigate ? Link : 'div';

  return (
    <div
      className={cn(
        'bg-background aspect-[0.8] md:hover:bg-muted-foreground/5 transition-colors duration-700 flex flex-col',
        className,
      )}
    >
      {/* Mobile Header for Media Posts */}
      {isMediaPost && (
        <div className='p-3 md:hidden flex gap-2 items-center justify-between'>
          <Author size='sm' />
          <p className='text-xs uppercase text-muted-foreground font-mono'>
            {formatRelativeCustom(post.createdAt)}
          </p>
        </div>
      )}

      <div className='flex-1 min-h-0 relative'>
        {isArticle ? (
          <ContentWrapper href={href} className='block h-full'>
            <ArticleContent post={post} />
          </ContentWrapper>
        ) : (
          <MediaContent post={post} href={href} isMobile={isMobile} />
        )}
      </div>

      {/* Mobile Footer for Media Posts */}
      {isMediaPost && isMobile && (
        <div className='p-3 md:hidden'>
          <span className='text-sm line-clamp-3 font-medium'>{post.title}</span>
        </div>
      )}
    </div>
  );
};

const ArticleContent = ({ post }: { post: PostWithPhotos }) => {
  if (post.coverImage && post.coverImage.length > 0) {
    return (
      <div className='h-full p-3'>
        <Image
          src={post.coverImage}
          alt={post.title}
          width={750}
          height={750}
          className='object-contain w-full h-full'
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
}: {
  post: PostWithPhotos;
  href: string;
  isMobile: boolean;
}) => {
  const photos = post.postsToPhotos || [];
  const firstPhoto = photos[0]?.photo;
  const secondPhoto = photos[1]?.photo;

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
                <SwiperSlide key={ptp.photo.id} className='p-3 h-full'>
                  <BlurImage
                    src={ptp.photo.url}
                    alt={ptp.photo.title ?? `${post.title} - ${i + 1}`}
                    width={ptp.photo.width / 4}
                    height={ptp.photo.height / 4}
                    blurhash={ptp.photo.blurData}
                    className='object-contain w-full h-full'
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
            <div className='h-full w-full p-3'>
              <BlurImage
                src={firstPhoto.url}
                alt={firstPhoto.title ?? post.title}
                width={firstPhoto.width / 4}
                height={firstPhoto.height / 4}
                blurhash={firstPhoto.blurData}
                className='object-contain w-full h-full'
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className='h-full w-full p-3'>
        <BlurImage
          src={firstPhoto.url}
          alt={firstPhoto.title ?? post.title}
          width={firstPhoto.width / 4}
          height={firstPhoto.height / 4}
          blurhash={firstPhoto.blurData}
          className='object-contain w-full h-full'
        />
      </div>
    );
  }

  // Desktop view: Link to modal with hover preview for albums
  return (
    <Link className='block h-full p-3 relative group' href={href}>
      <BlurImage
        src={firstPhoto.url}
        alt={firstPhoto.title ?? post.title}
        width={firstPhoto.width / 4}
        height={firstPhoto.height / 4}
        blurhash={firstPhoto.blurData}
        className='object-contain w-full h-full transition-opacity duration-300 group-hover:opacity-0'
      />
      {post.type === 'ALBUM' && secondPhoto && (
        <div className='absolute inset-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
          <Image
            src={secondPhoto.url}
            alt={secondPhoto.title ?? post.title}
            width={secondPhoto.width / 4}
            height={secondPhoto.height / 4}
            className='object-contain w-full h-full'
          />
        </div>
      )}
    </Link>
  );
};
