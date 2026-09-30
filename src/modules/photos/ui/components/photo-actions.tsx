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
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { photoGetMany } from '../../types';

interface PhotoActionsProps {
  photo: photoGetMany[number];
}

export function PhotoActions({ photo }: PhotoActionsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [ConfirmDialog, confirm] = useConfirm(
    'Foto löschen',
    `Möchtest du "${photo.title || 'dieses Foto'}" wirklich unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
  );

  const deletePhoto = useMutation(trpc.photos.remove.mutationOptions());
  const editPath = `/dashboard/photos/${photo.id}`;
  const fullImageUrl = keyToUrl(photo.url);

  const handleDelete = async () => {
    const ok = await confirm();
    if (!ok) return;

    deletePhoto.mutate(
      { id: photo.id },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries(trpc.photos.getMany.queryOptions({}));
          toast.success('Foto erfolgreich gelöscht');
        },
        onError: (error) => {
          toast.error(error.message || 'Fehler beim Löschen des Fotos');
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
            <Link href={fullImageUrl} target='_blank'>
              <ExternalLink className='mr-2 size-4' />
              <span>Vollbild öffnen</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleDelete}
            disabled={deletePhoto.isPending}
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
