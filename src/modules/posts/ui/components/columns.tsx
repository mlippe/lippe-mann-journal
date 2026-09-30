'use client';

import { ColumnDef } from '@tanstack/react-table';
import { VisibilityToggle } from './visibility-toggle';
import { PostActions } from './post-actions';
import Link from 'next/link';
import { Post } from '@/db/schema';

export const columns: ColumnDef<Post>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => {
      const editPath = `/dashboard/posts/${row.original.slug}`;
      return (
        <Link
          href={editPath}
          className='font-medium hover:underline block truncate max-w-xs md:max-w-md'
        >
          {row.original.title}
        </Link>
      );
    },
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
    header: () => <span className='sr-only'>Actions</span>,
    cell: ({ row }) => {
      return (
        <div className='flex justify-end'>
          <PostActions post={row.original} />
        </div>
      );
    },
  },
];
