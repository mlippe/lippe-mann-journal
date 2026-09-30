'use client';

import { useTRPC } from '@/trpc/client';
import { columns } from '../components/columns';
import { DataTable } from '@/components/data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DataPagination } from '@/components/data-pagination';
import { usePhotosFilters } from '../../hooks/use-photos-filters';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { IconAlertTriangle, IconPhotoOff } from '@tabler/icons-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useErrorBoundary } from 'react-error-boundary';
import { useModal } from '@/hooks/use-modal';

import { PhotoCardMobile } from '../components/photo-card-mobile';

export const DashboardPhotosView = () => {
  const trpc = useTRPC();
  const [filters, setFilters] = usePhotosFilters();
  const { data } = useSuspenseQuery(
    trpc.photos.getMany.queryOptions({ ...filters }),
  );

  return (
    <div>
      {data.items.length === 0 ? (
        <EmptyStatus />
      ) : (
        <>
          {/* Mobile Touch Cards (< md) */}
          <div className='md:hidden space-y-2.5'>
            {data.items.map((photo) => (
              <PhotoCardMobile key={photo.id} photo={photo} />
            ))}
          </div>

          {/* Desktop Data Table (>= md) */}
          <div className='hidden md:block'>
            <DataTable data={data.items} columns={columns} />
          </div>

          <DataPagination
            page={filters.page}
            totalPages={data.totalPages}
            onPageChange={(page) => {
              setFilters({ page });
            }}
          />
        </>
      )}
    </div>
  );
};

const EmptyStatus = () => {
  const modal = useModal();

  return (
    <Empty className='border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <IconPhotoOff />
        </EmptyMedia>
        <EmptyTitle>No photos found</EmptyTitle>
        <EmptyDescription>
          You have no photos. Upload some photos to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant='outline' size='sm' onClick={modal.onOpen}>
          Add Photos
        </Button>
      </EmptyContent>
    </Empty>
  );
};

export const ErrorStatus = () => {
  const { resetBoundary } = useErrorBoundary();

  return (
    <div className='px-4 md:px-8'>
      <Empty className='border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <IconAlertTriangle />
          </EmptyMedia>
          <EmptyTitle>Something went wrong</EmptyTitle>
          <EmptyDescription>Please try again later.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant='outline' size='sm' onClick={resetBoundary}>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
};

export const LoadingStatus = () => {
  return (
    <div className='space-y-4'>
      {/* Mobile Loading Skeleton */}
      <div className='md:hidden space-y-2.5'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className='flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card'
          >
            <Skeleton className='size-14 rounded-lg shrink-0' />
            <div className='flex-1 min-w-0 space-y-2'>
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-3 w-28' />
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
              <TableHead className='pl-6 w-20'>Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Taken At</TableHead>
              <TableHead className='text-right pr-6'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className='pl-6'>
                  <Skeleton className='size-14 rounded-md' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-48' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-32' />
                </TableCell>
                <TableCell className='text-right pr-6'>
                  <Skeleton className='size-8 rounded-md ml-auto' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
