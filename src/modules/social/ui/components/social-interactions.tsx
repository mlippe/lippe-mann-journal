'use client';

import { useState } from 'react';
import { useTRPC } from '@/trpc/client';
import { useIdentity } from '@/hooks/use-identity';
import { Button } from '@/components/ui/button';
import {
  IconHeart,
  IconHeartFilled,
  IconMessageCircle,
  IconSend,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { type SocialInteractionsData } from '@/modules/social/types';

interface SocialInteractionsProps {
  postId: string;
  variant?: 'compact' | 'full';
  commentHref?: string;
}

export const SocialInteractions = ({
  postId,
  variant = 'full',
  commentHref,
}: SocialInteractionsProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { fingerprint, username, updateUsername, isLoaded } = useIdentity();
  const [commentContent, setCommentContent] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');

  const interactionParams = {
    postId,
    userFingerprint: fingerprint ?? undefined,
  };
  const queryOptions =
    trpc.social.getInteractions.queryOptions(interactionParams);

  const { data: interactions, isLoading } = useQuery({
    ...queryOptions,
    enabled: isLoaded,
  });

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

  const addComment = useMutation(
    trpc.social.addComment.mutationOptions({
      onSuccess: () => {
        setCommentContent('');
        queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
      },
    }),
  );

  const syncUsername = useMutation(
    trpc.social.updateUsername.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
      },
    }),
  );

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!fingerprint) return;
    toggleLike.mutate({ postId, userFingerprint: fingerprint });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fingerprint || !username || !commentContent.trim()) return;
    addComment.mutate({
      postId,
      userFingerprint: fingerprint,
      username,
      content: commentContent.trim(),
    });
  };

  const handleUpdateUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUsername.trim() && fingerprint) {
      const newName = tempUsername.trim();
      updateUsername(newName);
      syncUsername.mutate({
        userFingerprint: fingerprint,
        newUsername: newName,
      });
      setIsEditingUsername(false);
    }
  };

  const startEditingUsername = () => {
    setTempUsername(username || '');
    setIsEditingUsername(true);
  };

  if (isLoading || !isLoaded) {
    return (
      <div className='flex gap-4 items-center h-full'>
        <Skeleton className='h-8 w-12' />
        <Skeleton className='h-8 w-12' />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className='flex items-center gap-3'>
        <button
          onClick={handleLike}
          className='flex items-center gap-1 group transition-colors'
        >
          {interactions?.hasLiked ? (
            <IconHeartFilled className='size-5 text-red-500' />
          ) : (
            <IconHeart className='size-5 group-hover:text-red-500' />
          )}
          <span className='text-xs font-medium'>
            {interactions?.likeCount || 0}
          </span>
        </button>
        {commentHref ? (
          <a
            href={commentHref}
            className='flex items-center gap-1 hover:text-foreground/80 transition-colors'
          >
            <IconMessageCircle className='size-5' />
            <span className='text-xs font-medium'>
              {interactions?.comments.length || 0}
            </span>
          </a>
        ) : (
          <div className='flex items-center gap-1'>
            <IconMessageCircle className='size-5' />
            <span className='text-xs font-medium'>
              {interactions?.comments.length || 0}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full gap-4'>
      {/* Actions */}
      <div className='flex items-center gap-4'>
        <button
          onClick={handleLike}
          className='flex items-center gap-1.5 group transition-colors'
        >
          {interactions?.hasLiked ? (
            <IconHeartFilled className='size-6 text-red-500' />
          ) : (
            <IconHeart className='size-6 group-hover:text-red-500' />
          )}
          <span className='text-sm font-semibold'>
            {interactions?.likeCount || 0}
          </span>
        </button>
        <div className='flex items-center gap-1.5'>
          <IconMessageCircle className='size-6' />
          <span className='text-sm font-semibold'>
            {interactions?.comments.length || 0}
          </span>
        </div>
      </div>

      {/* Comments List */}
      <div className='flex-1 pr-4 -mr-4 overflow-y-auto'>
        <div className='space-y-4'>
          {interactions?.comments.map((comment) => (
            <div key={comment.id} className='flex flex-col gap-1'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-bold'>{comment.username}</span>
                <span className='text-[10px] uppercase tracking-tighter text-muted-foreground'>
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: de,
                  })}
                </span>
              </div>
              <p className='text-sm text-foreground/80 leading-snug'>
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Area with Username Toggle */}
      <div className='pt-2 border-t space-y-2'>
        <div className='flex items-center justify-between px-1'>
          <button
            onClick={startEditingUsername}
            className='text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-medium text-left'
          >
            Als <span className='underline decoration-dotted'>{username}</span>{' '}
            kommentieren:
          </button>
        </div>

        {isEditingUsername ? (
          <form onSubmit={handleUpdateUsername} className='flex flex-col gap-2'>
            <Input
              autoFocus
              placeholder='Neuer Name...'
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              className='bg-muted/50 border-none h-10 text-sm'
              onBlur={() => !tempUsername.trim() && setIsEditingUsername(false)}
            />
            <div className='flex gap-2'>
              <Button size='sm' type='submit' disabled={!tempUsername.trim()}>
                Speichern
              </Button>
              <Button
                size='sm'
                variant='ghost'
                type='button'
                onClick={() => setIsEditingUsername(false)}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleComment}
            className='relative flex items-end gap-2'
          >
            <div className='relative flex-1'>
              <Textarea
                placeholder='Dein Kommentar...'
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                initialSize='sm'
                className={cn(
                  'bg-muted/30 border-border/50 hover:bg-muted/50 focus:bg-background transition-all duration-300  py-2.5 pr-12 text-sm resize-none shadow-none focus:ring-0 focus-visible:ring-0 focus-visible:border-foreground/30',
                  commentContent.length > 0 && 'min-h-[60px]',
                )}
              />
              <div
                className={cn(
                  'absolute bottom-1.5 right-1.5 transition-all duration-300 ease-[cubic-bezier(0.22, 1, 0.36, 1)]',
                  commentContent.trim()
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-90 pointer-events-none',
                )}
              >
                <Button
                  size='icon-sm'
                  type='submit'
                  disabled={!commentContent.trim() || addComment.isPending}
                  className='size-7 rounded-full shadow-md bg-foreground text-background hover:bg-foreground/90'
                >
                  <IconSend className='size-3.5' />
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
