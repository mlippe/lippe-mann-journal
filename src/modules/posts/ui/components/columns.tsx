'use client';

import { ColumnDef } from '@tanstack/react-table';
import { PostGetMany } from '../../types';
import { VisibilityToggle } from './visibility-toggle';
import { DeletePostButton } from './delete-post-button';
import Link from 'next/link';
import { PenBoxIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const columns: ColumnDef<PostGetMany[number]>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <span className='capitalize font-medium text-xs bg-muted px-2 py-1 rounded'>
          {type.toLowerCase()}
        </span>
      );
    },
  },
  {
    accessorKey: 'visibility',
    header: 'Visibility',
    cell: ({ row }) => {
      return (
        <VisibilityToggle
          postId={row.original.id}
          initialValue={row.original.visibility}
        />
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const editPath = `/dashboard/posts/${row.original.slug}`;

      return (
        <div className='flex items-center gap-x-2'>
          <DeletePostButton
            postId={row.original.id}
            postTitle={row.original.title}
          />

          <Button variant='ghost' size='icon' asChild>
            <Link href={editPath}>
              <PenBoxIcon className='h-4 w-4' />
            </Link>
          </Button>
        </div>
      );
    },
  },
];
