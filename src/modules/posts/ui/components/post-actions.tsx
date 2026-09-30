'use client';

import { toast } from 'sonner';
import { MoreHorizontal, Pencil, ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '@/hooks/use-confirm';
import Link from 'next/link';
import { Post } from '@/db/schema';

interface PostActionsProps {
  post: Post;
}

export function PostActions({ post }: PostActionsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [ConfirmDialog, confirm] = useConfirm(
    'Beitrag löschen',
    `Möchtest du "${post.title}" wirklich unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
  );

  const deletePost = useMutation(trpc.posts.remove.mutationOptions());
  const updatePost = useMutation(trpc.posts.update.mutationOptions());

  const editPath = `/dashboard/posts/${post.slug}`;
  const publicPath =
    post.type === 'ARTICLE'
      ? `/article/${post.slug}`
      : post.type === 'PHOTO'
        ? `/photo/${post.slug}`
        : `/album/${post.slug}`;

  const handleDelete = async () => {
    const ok = await confirm();
    if (!ok) return;

    deletePost.mutate(
      { id: post.id },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries(trpc.posts.getMany.queryOptions({}));
          await queryClient.invalidateQueries(trpc.posts.getPublished.queryOptions({}));
          await queryClient.invalidateQueries(trpc.blog.getMany.queryOptions());
          toast.success('Beitrag erfolgreich gelöscht');
        },
        onError: (error) => {
          toast.error(error.message || 'Fehler beim Löschen des Beitrags');
        },
      },
    );
  };

  const handleToggleVisibility = () => {
    const newVisibility = post.visibility === 'public' ? 'private' : 'public';
    updatePost.mutate(
      {
        id: post.id,
        visibility: newVisibility,
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries(trpc.posts.getMany.queryOptions({}));
          await queryClient.invalidateQueries(trpc.posts.getPublished.queryOptions({}));
          toast.success(
            `Beitrag ist jetzt ${newVisibility === 'public' ? 'öffentlich' : 'privat'}`,
          );
        },
        onError: (error) => {
          toast.error(error.message || 'Fehler beim Ändern der Sichtbarkeit');
        },
      },
    );
  };

  return (
    <>
      <ConfirmDialog />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='size-9 sm:size-8 text-muted-foreground hover:text-foreground'
            aria-label='Aktionen öffnen'
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className='size-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48' onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem asChild>
            <Link href={editPath}>
              <Pencil className='mr-2 size-4' />
              <span>Bearbeiten</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={publicPath} target='_blank'>
              <ExternalLink className='mr-2 size-4' />
              <span>Live ansehen</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleToggleVisibility}
            disabled={updatePost.isPending}
          >
            {post.visibility === 'public' ? (
              <>
                <EyeOff className='mr-2 size-4' />
                <span>Auf Privat setzen</span>
              </>
            ) : (
              <>
                <Eye className='mr-2 size-4' />
                <span>Veröffentlichen</span>
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleDelete}
            disabled={deletePost.isPending}
            className='text-destructive focus:text-destructive focus:bg-destructive/10'
          >
            <Trash2 className='mr-2 size-4' />
            <span>Löschen</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
