'use client';

import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';
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
import { usePostsFilters } from '../../hooks/use-posts-filters';

import { PostCardMobile } from './post-card-mobile';

interface PostsListProps {
  type?: 'ARTICLE' | 'PHOTO' | 'ALBUM';
}

export const PostsList = ({ type }: PostsListProps) => {
  const trpc = useTRPC();
  const [filters, setFilters] = usePostsFilters();

  const { data } = useSuspenseQuery(
    trpc.posts.getMany.queryOptions({ 
        ...filters,
        type: type || filters.type,
     }),
  );

  return (
    <>
      <div className='flex-1 pb-4 flex flex-col gap-y-4'>
        {data.items.length === 0 ? (
          <EmptyStatus type={type} />
        ) : (
          <>
            {/* Mobile Touch Cards (< md) */}
            <div className='md:hidden space-y-2.5'>
              {data.items.map((post) => (
                <PostCardMobile key={post.id} post={post} />
              ))}
            </div>

            {/* Desktop Data Table (>= md) */}
            <div className='hidden md:block'>
              <DataTable columns={columns} data={data.items} />
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
    </>
  );
};

const EmptyStatus = ({ type }: { type?: string }) => {
  const label = type ? type.toLowerCase() : 'posts';
  return (
    <Empty className='border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <IconNotebookOff />
        </EmptyMedia>
        <EmptyTitle>No {label} found</EmptyTitle>
        <EmptyDescription>
          You have no {label}. Create some {label} to get started.
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
    <div className='flex-1 pb-4 flex flex-col gap-y-4'>
      {/* Mobile Loading Skeleton */}
      <div className='md:hidden space-y-2.5'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className='flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card'
          >
            <Skeleton className='size-14 rounded-lg shrink-0' />
            <div className='flex-1 min-w-0 space-y-2'>
              <Skeleton className='h-4 w-3/4' />
              <div className='flex gap-2'>
                <Skeleton className='h-3 w-12 rounded' />
                <Skeleton className='h-3 w-16' />
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
              <TableHead className='pl-6'>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className='text-right pr-6'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className='pl-6'>
                  <Skeleton className='h-4 w-48' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-5 w-16 rounded' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-5 w-20 rounded-full' />
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
