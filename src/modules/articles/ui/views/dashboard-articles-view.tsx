'use client';

import { useTRPC } from '@/trpc/client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { columns } from '../components/columns';
import { DataPagination } from '@/components/data-pagination';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { IconNotebookOff } from '@tabler/icons-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useArticlesFilters } from '../../hooks/use-articles-filters';

export const DashboardArticlesView = () => {
  const trpc = useTRPC();
  const [filters, setFilters] = useArticlesFilters();

  const { data } = useSuspenseQuery(
    trpc.posts.getMany.queryOptions({ ...filters }),
  );

  return (
    <>
      <div className='flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4'>
        {data.items.length === 0 ? (
          <EmptyStatus />
        ) : (
          <>
            <DataTable columns={columns} data={data.items} />
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
    </>
  );
};

const EmptyStatus = () => {
  return (
    <Empty className='border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <IconNotebookOff />
        </EmptyMedia>
        <EmptyTitle>No articles found</EmptyTitle>
        <EmptyDescription>
          You have no articles. Create some articles to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent></EmptyContent>
    </Empty>
  );
};

export const ErrorStatus = () => {
  return <div>Something went wrong</div>;
};

export const LoadingStatus = () => {
  return (
    <div className='flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4'>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-6'>Title</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className='text-right pr-6'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className='pl-6'>
                  <div className='flex flex-col gap-2'>
                    <Skeleton className='h-4 w-45' />
                    <Skeleton className='h-3 w-65' />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className='h-6 w-24 rounded-full' />
                </TableCell>
                <TableCell className='text-right pr-6'>
                  <div className='flex justify-end gap-2'>
                    <Skeleton className='h-8 w-8 rounded-full' />
                    <Skeleton className='h-8 w-8 rounded-full' />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
