'use client';

import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '@/hooks/use-confirm';

interface DeletePostButtonProps {
  postId: string;
  postTitle: string;
}

export function DeletePostButton({
  postId,
  postTitle,
}: DeletePostButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [ConfirmDialog, confirm] = useConfirm(
    'Beitrag löschen',
    `Möchtest du den Beitrag "${postTitle}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
  );

  const deletePost = useMutation(trpc.posts.remove.mutationOptions());

  const handleDelete = async () => {
    const ok = await confirm();

    if (!ok) return;

    deletePost.mutate(
      { id: postId },
      {
        onSuccess: async () => {
          // Invalidate queries to refetch posts list
          await queryClient.invalidateQueries(
            trpc.posts.getMany.queryOptions({}),
          );
          await queryClient.invalidateQueries(
            trpc.posts.getPublished.queryOptions({}),
          );
          await queryClient.invalidateQueries(trpc.blog.getMany.queryOptions());
          toast.success('Beitrag erfolgreich gelöscht');
        },
        onError: (error) => {
          toast.error(error.message || 'Fehler beim Löschen des Beitrags');
        },
      },
    );
  };

  return (
    <>
      <ConfirmDialog />
      <Button
        variant='ghost'
        size='icon'
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
        title='Beitrag löschen'
      >
        <Trash2 className='size-4' />
      </Button>
    </>
  );
}
