'use client';

import { toast } from 'sonner';
import { MoreHorizontal, Pencil, ExternalLink, Trash2 } from 'lucide-react';
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
import { Collection } from '@/db/schema';

interface CollectionActionsProps {
  collection: Collection;
}

export function CollectionActions({ collection }: CollectionActionsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [ConfirmDialog, confirm] = useConfirm(
    'Collection löschen',
    `Möchtest du "${collection.name}" wirklich unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
  );

  const removeCollection = useMutation(
    trpc.collections.remove.mutationOptions({
      onSuccess: () => {
        toast.success('Collection erfolgreich gelöscht');
        queryClient.invalidateQueries(
          trpc.collections.getAllCollections.queryOptions({}),
        );
      },
      onError: (e) => toast.error(`Fehler beim Löschen: ${e.message}`),
    }),
  );

  const editPath = `/dashboard/collections/${collection.slug}`;
  const publicPath = `/collections/${collection.slug}`;

  const handleDelete = async () => {
    const ok = await confirm();
    if (!ok) return;

    removeCollection.mutate({ id: collection.id });
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

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleDelete}
            disabled={removeCollection.isPending}
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
