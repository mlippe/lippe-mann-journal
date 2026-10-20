'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Collection } from '@/db/schema';
import { Badge } from '@/components/ui/badge';
import { CollectionActions } from './collection-actions';
import Link from 'next/link';
import { format } from 'date-fns';

export const columns: ColumnDef<Collection>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const collection = row.original;
      return (
        <div className='flex flex-col'>
          <Link
            href={`/dashboard/collections/${collection.slug}`}
            className='font-medium hover:underline'
          >
            {collection.name}
          </Link>
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
        <Badge variant='secondary'>Hervorgehoben</Badge>
      ) : (
        <Badge variant='outline'>Standard</Badge>
      );
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Zuletzt aktualisiert',
    cell: ({ row }) => {
      const date = row.getValue('updatedAt') as Date;
      return (
        <span className='text-sm text-muted-foreground'>{format(new Date(date), 'dd.MM.yyyy')}</span>
      );
    },
  },
  {
    id: 'actions',
    header: () => <span className='sr-only'>Aktionen</span>,
    cell: ({ row }) => (
      <div className='flex justify-end'>
        <CollectionActions collection={row.original} />
      </div>
    ),
  },
];

