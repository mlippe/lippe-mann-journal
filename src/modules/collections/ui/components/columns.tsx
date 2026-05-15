'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Collection } from '@/db/schema';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const columns: ColumnDef<Collection>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const collection = row.original;
      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{collection.name}</span>
          <span className='text-xs text-muted-foreground'>
            {collection.slug}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'isFeatured',
    header: 'Status',
    cell: ({ row }) => {
      const isFeatured = row.getValue('isFeatured') as boolean;
      return isFeatured ? (
        <Badge variant='secondary'>Featured</Badge>
      ) : (
        <Badge variant='outline'>Standard</Badge>
      );
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last Updated',
    cell: ({ row }) => {
      const date = row.getValue('updatedAt') as Date;
      return (
        <span className='text-sm'>{format(new Date(date), 'MMM d, yyyy')}</span>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionCell collection={row.original} />,
  },
];

const ActionCell = ({ collection }: { collection: Collection }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const removeCollection = useMutation(
    trpc.collections.remove.mutationOptions({
      onSuccess: () => {
        toast.success('Collection deleted');
        queryClient.invalidateQueries(
          trpc.collections.getAllCollections.queryOptions(),
        );
      },
      onError: (e) => toast.error(`Failed to delete: ${e.message}`),
    }),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>Open menu</span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/collections/${collection.slug}`}>
            <Pencil className='mr-2 h-4 w-4' />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/collections/${collection.slug}`} target='_blank'>
            <ExternalLink className='mr-2 h-4 w-4' />
            View Publicly
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className='text-destructive'
          onClick={() => {
            if (confirm('Are you sure you want to delete this collection?')) {
              removeCollection.mutate({ id: collection.id });
            }
          }}
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
