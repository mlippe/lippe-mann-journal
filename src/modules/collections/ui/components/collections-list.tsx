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
      <DataTable columns={columns} data={data} />
    </div>
  );
};

const LoadingStatus = () => {
  return (
    <div className='flex-1 pb-4 flex flex-col gap-y-4'>
      <div className='rounded-md border'>
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
                  <div className='flex flex-col gap-2'>
                    <Skeleton className='h-4 w-40' />
                    <Skeleton className='h-3 w-32' />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className='h-6 w-20 rounded-full' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-24' />
                </TableCell>
                <TableCell className='text-right pr-6'>
                  <Skeleton className='ml-auto h-8 w-8 rounded-full' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
