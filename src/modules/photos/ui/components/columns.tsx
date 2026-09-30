'use client';

import { ColumnDef } from '@tanstack/react-table';
import { photoGetMany } from '../../types';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import BlurImage from '@/components/blur-image';
import { formatExifDate } from '../../lib/utils';
import { PhotoActions } from './photo-actions';
import Link from 'next/link';

export const columns: ColumnDef<photoGetMany[number]>[] = [
  {
    accessorKey: 'url',
    header: 'Image',
    cell: ({ row }) => {
      const url = row.original.url;
      const imageUrl = keyToUrl(url);

      return (
        <div className='w-14 h-14 relative rounded-md overflow-hidden bg-muted border border-border/40'>
          <BlurImage
            src={imageUrl}
            alt={row.original.title || 'Photo'}
            fill
            blurhash={row.original.blurData}
            className='object-cover'
            sizes='56px'
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => {
      const editPath = `/dashboard/photos/${row.original.id}`;
      return (
        <Link
          href={editPath}
          className='font-medium hover:underline block truncate max-w-xs md:max-w-md'
        >
          {row.original.title || 'Ohne Titel'}
        </Link>
      );
    },
  },
  {
    accessorKey: 'dateTimeOriginal',
    header: 'Taken At',
    cell: ({ row }) => {
      const takenAt = row.original.dateTimeOriginal;
      if (!takenAt) return <span className='text-muted-foreground'>-</span>;

      // Use formatExifDate for consistent formatting without timezone shifts
      const formatted = formatExifDate(takenAt, 'MMM d, yyyy HH:mm');

      return <span suppressHydrationWarning className='text-sm text-muted-foreground'>{formatted}</span>;
    },
  },
  {
    id: 'actions',
    header: () => <span className='sr-only'>Actions</span>,
    cell: ({ row }) => {
      return (
        <div className='flex justify-end'>
          <PhotoActions photo={row.original} />
        </div>
      );
    },
  },
];

