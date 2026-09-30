'use client';

import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { IconFolderOff } from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { CollectionCardMobile } from './collection-card-mobile';

export const CollectionsList = () => {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.collections.getAllCollections.queryOptions({}),
  );

  if (isLoading) {
    return <LoadingStatus />;
  }

  if (!data || data.length === 0) {
    return (
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <IconFolderOff />
          </EmptyMedia>
          <EmptyTitle>No collections found</EmptyTitle>
          <EmptyDescription>
            Create your first collection to start organizing your posts.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className='flex-1 pb-4 flex flex-col gap-y-4'>
      {/* Mobile Touch Cards (< md) */}
      <div className='md:hidden space-y-2.5'>
        {data.map((collection) => (
          <CollectionCardMobile key={collection.id} collection={collection} />
        ))}
      </div>

      {/* Desktop Data Table (>= md) */}
      <div className='hidden md:block'>
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
};

const LoadingStatus = () => {
  return (
    <div className='flex-1 pb-4 flex flex-col gap-y-4'>
      {/* Mobile Loading Skeleton */}
      <div className='md:hidden space-y-2.5'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className='flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card'
          >
            <Skeleton className='size-14 rounded-lg shrink-0' />
            <div className='flex-1 min-w-0 space-y-2'>
              <Skeleton className='h-4 w-3/4' />
              <div className='flex gap-2'>
                <Skeleton className='h-3 w-16 rounded' />
                <Skeleton className='h-3 w-20' />
              </div>
            </div>
            <Skeleton className='size-8 rounded-md shrink-0' />
          </div>
        ))}
      </div>

      {/* Desktop Loading Skeleton */}
      <div className='hidden md:block rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-6'>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className='text-right pr-6'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className='pl-6'>
                  <div className='flex flex-col gap-1.5'>
                    <Skeleton className='h-4 w-40' />
                    <Skeleton className='h-3 w-24' />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className='h-5 w-20 rounded-full' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-24' />
                </TableCell>
                <TableCell className='text-right pr-6'>
                  <Skeleton className='ml-auto size-8 rounded-md' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
