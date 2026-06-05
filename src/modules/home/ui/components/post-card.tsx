import { type PostWithPhotos } from '@/db/schema';
import Image from 'next/image';
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
  IconHeartFilled,
  IconLibraryPhoto,
  IconPhoto,
  IconTextSize,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { SocialInteractions } from '@/modules/social/ui/components/social-interactions';
import clsx from 'clsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';
import { useIdentity } from '@/hooks/use-identity';
import { type SocialInteractionsData } from '@/modules/social/types';

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
  const [isHovered, setIsHovered] = useState(false);
  const isArticle = post.type === 'ARTICLE';
  const PostTypeIcon = POST_TYPE_INFO[post.type].icon;
  const postTypeDisplayString = POST_TYPE_INFO[post.type].displayString;
  const postTypeActionString = POST_TYPE_INFO[post.type].actionString;

  const href = isArticle
    ? `/article/${post.slug}`
    : post.type === 'PHOTO'
      ? `/photo/${post.slug}`
      : `/album/${post.slug}`;

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
        <a
          className='p-3 pt-6 md:hidden flex gap-2 items-center justify-between'
          href={href}
        >
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
        </a>
      )}

      <div
        className={cn(
          'relative aspect-[0.8]',
          isArticle && isMobile && 'aspect-[1.25]',
        )}
      >
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
          <Link href={href} className='block h-full relative'>
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
          </Link>
        ) : (
          <MediaContent
            post={post}
            href={href}
            isMobile={isMobile}
            priority={isPriority}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
          />
        )}
      </div>

      {/* Mobile Footer Non Article */}
      {isMobile && !isArticle && (
        <div className='p-3 pt-5 pb-6 md:hidden flex gap-2 flex-col w-full'>
          <div className='flex items-center justify-between gap-4'>
            <p className='text-sm line-clamp-3 block max-w-xl pr-2 flex-1'>
              {post.title}
            </p>
            <SocialInteractions
              postId={post.id}
              variant='compact'
              commentHref={href}
            />
          </div>
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
          <p className='text-sm line-clamp-4 text-foreground/70 -mt-0.5 max-w-lg'>
            {createPreview(post.content)}
          </p>

          <Button className='text-xs  gap-1  mt-2' size='lg' asChild>
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
    <div className='h-full p-3 flex justify-center items-center'>
      <div className='from-muted from-25% to-foreground/30 bg-linear-to-br  h-full flex items-center justify-center p-8 text-center font-medium aspect-[0.66667]'>
        <IconTextSize className='size-14  text-foreground/80' />
      </div>
    </div>
  );
};

const MediaContent = ({
  post,
  href,
  isMobile,
  priority,
  isHovered,
  setIsHovered,
}: {
  post: PostWithPhotos;
  href: string;
  isMobile: boolean;
  priority: boolean;
  isHovered: boolean;
  setIsHovered: (value: boolean) => void;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { fingerprint, isLoaded } = useIdentity();

  const interactionParams = {
    postId: post.id,
    userFingerprint: fingerprint ?? undefined,
  };
  const queryOptions =
    trpc.social.getInteractions.queryOptions(interactionParams);

  const toggleLike = useMutation(
    trpc.social.toggleLike.mutationOptions({
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: queryOptions.queryKey });
        const previous = queryClient.getQueryData<SocialInteractionsData>(
          queryOptions.queryKey,
        );

        if (previous) {
          queryClient.setQueryData<SocialInteractionsData>(
            queryOptions.queryKey,
            {
              ...previous,
              likeCount: previous.hasLiked
                ? previous.likeCount - 1
                : previous.likeCount + 1,
              hasLiked: !previous.hasLiked,
            },
          );
        }
        return { previous };
      },
      onError: (err, newLike, context) => {
        if (context?.previous) {
          queryClient.setQueryData(queryOptions.queryKey, context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
      },
    }),
  );

  const lastTap = useRef<number>(0);
  const [showHeart, setShowHeart] = useState(false);

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMobile) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      e.preventDefault(); // Prevent navigation on double tap
      const interactions = queryClient.getQueryData<SocialInteractionsData>(
        queryOptions.queryKey,
      );
      if (fingerprint && isLoaded && !interactions?.hasLiked) {
        toggleLike.mutate({ postId: post.id, userFingerprint: fingerprint });
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTap.current = now;
  };

  const photos = post.postsToPhotos || [];
  const firstPhoto = photos.at(0)?.photo;

  // Use the server-provided coverIndex if available, otherwise use 0
  const coverIndex = post.coverIndex ?? 0;

  const coverPhoto = photos[coverIndex]?.photo || photos[0]?.photo;

  const [shouldRenderSwiper, setShouldRenderSwiper] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const id = useId();
  const uniqueId = id.replace(/:/g, '');
  const prevElId = `swiper-prev-${uniqueId}`;
  const nextElId = `swiper-next-${uniqueId}`;
  const paginationId = `swiper-pagination-${uniqueId}`;

  useEffect(() => {
    if (!isMobile || post.type !== 'ALBUM' || photos.length <= 1) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRenderSwiper(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '300px',
        threshold: 0,
      },
    );

    const currentContainer = containerRef.current;
    if (currentContainer) {
      observer.observe(currentContainer);
    }

    return () => {
      observer.disconnect();
    };
  }, [isMobile, post.type, photos.length]);

  if (!coverPhoto) return null;

  const sizes =
    '(max-width: 768px) calc(100vw - 1.5rem), (max-width: 1024px) calc(50vw - 1.5rem), calc(33vw - 1.5rem)';

  if (isMobile) {
    if (post.type === 'ALBUM' && photos.length > 1) {
      return (
        <div
          ref={containerRef}
          className='album-swiper-mobile-feed absolute inset-0'
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
                  prevEl: `#${prevElId}`,
                  nextEl: `#${nextElId}`,
                }}
                pagination={{
                  el: `#${paginationId}`,
                  clickable: true,
                }}
                initialSlide={coverIndex}
                className='h-full w-full'
              >
                {photos.map((ptp, i) => (
                  <SwiperSlide
                    key={ptp.photo.id}
                    className='p-3 h-full relative'
                    onClick={handleDoubleTap}
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
                    {showHeart && (
                      <div className='absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in zoom-in-50 fade-in duration-300'>
                        <IconHeartFilled className='size-24 text-white/90 drop-shadow-2xl' />
                      </div>
                    )}
                  </SwiperSlide>
                ))}
                <Button
                  id={prevElId}
                  size='icon-sm'
                  className='absolute top-1/2 left-1 -translate-y-1/2  z-10 cursor-pointer bg-background/50  backdrop-blur-sm border-none'
                  variant='outline'
                  aria-label='Vorheriges Foto'
                >
                  <IconArrowLeft />
                </Button>
                <Button
                  id={nextElId}
                  size='icon-sm'
                  className='absolute top-1/2 right-1 -translate-y-1/2  z-10 cursor-pointer bg-background/50  backdrop-blur-sm border-none'
                  variant='outline'
                  aria-label='Nächstes Foto'
                >
                  <IconArrowRight />
                </Button>
              </Swiper>
              <div id={paginationId} className='album-swiper-pagination' />
            </>
          ) : (
            <div className='h-full w-full p-3 relative'>
              <BlurImage
                src={keyToUrl(coverPhoto.url)}
                alt={coverPhoto.title ?? post.title}
                fill
                priority={priority}
                sizes={sizes}
                blurhash={coverPhoto.blurData}
                aspectRatio={coverPhoto.aspectRatio ?? undefined}
                className='object-contain p-3'
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        className='h-full w-full p-3 relative block'
        onClick={handleDoubleTap}
      >
        <BlurImage
          src={keyToUrl(coverPhoto.url)}
          alt={coverPhoto.title ?? post.title}
          fill
          priority={priority}
          sizes={sizes}
          blurhash={coverPhoto.blurData}
          aspectRatio={coverPhoto.aspectRatio ?? undefined}
          className='object-contain p-3'
        />
        {showHeart && (
          <div className='absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in zoom-in-50 fade-in duration-300'>
            <IconHeartFilled className='size-24 text-white/90 drop-shadow-2xl' />
          </div>
        )}
      </div>
    );
  }

  // Desktop view: Link to modal with hover preview for albums
  const isSamePhoto = firstPhoto?.id === coverPhoto.id;

  return (
    <>
      <Link
        className='block h-full p-3 relative group'
        href={href}
        onMouseEnter={() => setIsHovered(true)}
      >
        {isHovered && !isSamePhoto && firstPhoto && (
          <BlurImage
            src={keyToUrl(firstPhoto.url)}
            alt={firstPhoto.title ?? post.title}
            fill
            priority={false}
            sizes={sizes}
            blurhash={firstPhoto.blurData}
            aspectRatio={firstPhoto.aspectRatio ?? undefined}
            className='object-contain p-3'
          />
        )}
        <BlurImage
          src={keyToUrl(coverPhoto.url)}
          alt={coverPhoto.title ?? post.title}
          fill
          priority={priority}
          sizes={sizes}
          blurhash={coverPhoto.blurData}
          aspectRatio={coverPhoto.aspectRatio ?? undefined}
          className={cn(
            'object-contain p-3 bg-background',
            !isSamePhoto &&
              'group-hover:opacity-0 transition-opacity duration-500',
          )}
        />
      </Link>
      <div className='hidden md:block absolute bottom-6 right-6 z-30 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-auto'>
        <div className='bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border'>
          <SocialInteractions postId={post.id} variant='compact' />
        </div>
      </div>
    </>
  );
};
