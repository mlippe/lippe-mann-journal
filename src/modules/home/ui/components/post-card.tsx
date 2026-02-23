'use client';

import { type PostWithPhotos } from '@/db/schema';
import Image from 'next/image';
import Link from 'next/link';
import Author from '@/components/author';
import BlurImage from '@/components/blur-image';
import { formatRelativeCustom } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: PostWithPhotos;
  className?: string;
}

export const PostCard = ({ post, className }: PostCardProps) => {
  const isMediaPost = post.type === 'PHOTO' || post.type === 'ALBUM';
  const href = post.type === 'PHOTO' ? `/photo/${post.slug}` : `/album/${post.slug}`;

  return (
    <div className={cn(
      'bg-background aspect-[0.8] hover:bg-muted-foreground/5 transition-colors duration-700 flex flex-col',
      className
    )}>
      {/* Mobile Header for Media Posts */}
      {isMediaPost && (
        <div className='p-3 md:hidden flex gap-2 items-center justify-between'>
          <Author size='sm' />
          <p className='text-xs uppercase text-muted-foreground'>
            {formatRelativeCustom(post.createdAt)}
          </p>
        </div>
      )}

      <div className='flex-1 min-h-0 relative'>
        {post.type === 'ARTICLE' ? (
          <ArticleContent post={post} />
        ) : (
          <MediaContent post={post} href={href} />
        )}
      </div>

      {/* Mobile Footer for Media Posts */}
      {isMediaPost && (
        <div className='p-3 md:hidden'>
          <span className='text-sm line-clamp-3'>{post.title}</span>
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

const MediaContent = ({ post, href }: { post: PostWithPhotos; href: string }) => {
  const firstPhoto = post.postsToPhotos?.[0]?.photo;
  const secondPhoto = post.postsToPhotos?.[1]?.photo;

  if (!firstPhoto) return null;

  return (
    <Link className='block h-full p-3 relative group' href={href}>
      <BlurImage
        src={firstPhoto.url}
        alt={firstPhoto.title ?? post.title}
        width={firstPhoto.width / 4}
        height={firstPhoto.height / 4}
        blurhash={firstPhoto.blurData}
        className='object-contain w-full h-full'
      />
      {post.type === 'ALBUM' && secondPhoto && (
        <Image
          src={secondPhoto.url}
          alt={secondPhoto.title ?? post.title}
          width={secondPhoto.width / 4}
          height={secondPhoto.height / 4}
          className='absolute inset-0 z-10 object-contain w-full h-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        />
      )}
    </Link>
  );
};
