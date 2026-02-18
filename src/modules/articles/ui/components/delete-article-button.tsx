'use client';

import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '@/hooks/use-confirm';

interface DeleteArticleButtonProps {
  articleId: string;
  articleTitle: string;
}

export function DeleteArticleButton({
  articleId,
  articleTitle,
}: DeleteArticleButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [ConfirmDialog, confirm] = useConfirm(
    'Delete article',
    `Are you sure you want to delete "${articleTitle}"? This action cannot be undone. The article will be permanently deleted.`,
  );

  const deleteArticle = useMutation(trpc.posts.remove.mutationOptions());

  const handleDelete = async () => {
    const ok = await confirm();

    if (!ok) return;

    deleteArticle.mutate(
      { id: articleId },
      {
        onSuccess: async () => {
          // Invalidate queries to refetch articles list
          await queryClient.invalidateQueries(
            trpc.posts.getMany.queryOptions({}),
          );
          toast.success('article deleted successfully');
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to delete article');
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
        title='Delete article'
      >
        <Trash2 className='size-4' />
      </Button>
    </>
  );
}
