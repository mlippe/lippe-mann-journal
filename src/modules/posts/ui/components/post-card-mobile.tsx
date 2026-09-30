'use client';

import { Post } from '@/db/schema';
import { useRouter } from 'next/navigation';
import BlurImage from '@/components/blur-image';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { PostActions } from './post-actions';
import { IconNotebook, IconPhoto, IconPhotoVideo } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PostCardMobileProps {
  post: Post;
}

export function PostCardMobile({ post }: PostCardMobileProps) {
  const router = useRouter();
  const editPath = `/dashboard/posts/${post.slug}`;

  const formattedDate = post.createdAt
    ? format(new Date(post.createdAt), 'dd.MM.yy', { locale: de })
    : '';

  return (
    <div
      onClick={() => router.push(editPath)}
      className='group relative flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 active:scale-[0.99] transition-all cursor-pointer shadow-2xs'
    >
      {/* Thumbnail */}
      <div className='relative size-14 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border/40'>
        {post.coverImage ? (
          <BlurImage
            src={keyToUrl(post.coverImage)}
            alt={post.title}
            fill
            className='object-cover'
            sizes='56px'
          />
        ) : post.type === 'ARTICLE' ? (
          <IconNotebook className='size-6 text-muted-foreground' />
        ) : post.type === 'ALBUM' ? (
          <IconPhotoVideo className='size-6 text-muted-foreground' />
        ) : (
          <IconPhoto className='size-6 text-muted-foreground' />
        )}
      </div>

      {/* Info */}
      <div className='flex-1 min-w-0'>
        <h3 className='text-sm font-medium text-foreground truncate'>
          {post.title}
        </h3>
        <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
          <span className='capitalize font-medium text-[11px] bg-muted px-1.5 py-0.5 rounded'>
            {post.type.toLowerCase()}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-medium',
              post.visibility === 'public'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                post.visibility === 'public'
                  ? 'bg-emerald-500'
                  : 'bg-muted-foreground/60',
              )}
            />
            {post.visibility === 'public' ? 'Öffentlich' : 'Privat'}
          </span>
          {formattedDate && (
            <span className='text-[11px] text-muted-foreground/70 hidden min-[360px]:inline'>
              · {formattedDate}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div onClick={(e) => e.stopPropagation()} className='shrink-0'>
        <PostActions post={post} />
      </div>
    </div>
  );
}
