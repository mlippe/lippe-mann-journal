'use client';

import { useState } from 'react';
import { useTRPC } from '@/trpc/client';
import { useIdentity } from '@/hooks/use-identity';
import { Button } from '@/components/ui/button';
import { IconHeart, IconHeartFilled, IconMessageCircle, IconSend } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface SocialInteractionsProps {
  postId: string;
  variant?: 'compact' | 'full';
}

export const SocialInteractions = ({ postId, variant = 'full' }: SocialInteractionsProps) => {
  const trpc = useTRPC();
  const { fingerprint, username, isLoaded } = useIdentity();
  const [commentContent, setCommentContent] = useState('');

  const utils = trpc.useUtils();

  const { data: interactions, isLoading } = trpc.social.getInteractions.useQuery(
    { postId, userFingerprint: fingerprint ?? undefined },
    { enabled: isLoaded }
  );

  const toggleLike = trpc.social.toggleLike.useMutation({
    onMutate: async () => {
      await utils.social.getInteractions.cancel({ postId, userFingerprint: fingerprint ?? undefined });
      const previous = utils.social.getInteractions.getData({ postId, userFingerprint: fingerprint ?? undefined });

      if (previous) {
        utils.social.getInteractions.setData(
          { postId, userFingerprint: fingerprint ?? undefined },
          {
            ...previous,
            likeCount: previous.hasLiked ? previous.likeCount - 1 : previous.likeCount + 1,
            hasLiked: !previous.hasLiked,
          }
        );
      }
      return { previous };
    },
    onError: (err, newLike, context) => {
      if (context?.previous) {
        utils.social.getInteractions.setData({ postId, userFingerprint: fingerprint ?? undefined }, context.previous);
      }
    },
    onSettled: () => {
      utils.social.getInteractions.invalidate({ postId, userFingerprint: fingerprint ?? undefined });
    },
  });

  const addComment = trpc.social.addComment.useMutation({
    onSuccess: () => {
      setCommentContent('');
      utils.social.getInteractions.invalidate({ postId, userFingerprint: fingerprint ?? undefined });
    },
  });

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

  if (isLoading || !isLoaded) {
    return (
      <div className="flex gap-4 items-center">
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-8 w-12" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 group transition-colors"
        >
          {interactions?.hasLiked ? (
            <IconHeartFilled className="size-5 text-red-500" />
          ) : (
            <IconHeart className="size-5 group-hover:text-red-500" />
          )}
          <span className="text-xs font-medium">{interactions?.likeCount || 0}</span>
        </button>
        <div className="flex items-center gap-1">
          <IconMessageCircle className="size-5" />
          <span className="text-xs font-medium">{interactions?.comments.length || 0}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 group transition-colors"
        >
          {interactions?.hasLiked ? (
            <IconHeartFilled className="size-6 text-red-500" />
          ) : (
            <IconHeart className="size-6 group-hover:text-red-500" />
          )}
          <span className="text-sm font-semibold">{interactions?.likeCount || 0}</span>
        </button>
        <div className="flex items-center gap-1.5">
          <IconMessageCircle className="size-6" />
          <span className="text-sm font-semibold">{interactions?.comments.length || 0}</span>
        </div>
      </div>

      {/* Comments List */}
      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="space-y-4">
          {interactions?.comments.map((comment) => (
            <div key={comment.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{comment.username}</span>
                <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: de,
                  })}
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-snug">
                {comment.content}
              </p>
            </div>
          ))}
          {interactions?.comments.length === 0 && (
            <p className="text-sm text-muted-foreground italic py-4">
              Noch keine Kommentare. Sei der Erste!
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleComment} className="flex gap-2 pt-2 border-t">
        <Input
          placeholder="Kommentieren..."
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          className="bg-muted/50 border-none h-9 text-sm"
        />
        <Button
          size="icon-sm"
          type="submit"
          disabled={!commentContent.trim() || addComment.isPending}
        >
          <IconSend className="size-4" />
        </Button>
      </form>
    </div>
  );
};
