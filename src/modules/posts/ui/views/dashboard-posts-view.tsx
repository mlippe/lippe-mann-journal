'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostsList, LoadingStatus, ErrorStatus } from '../components/posts-list';
import { usePostsFilters } from '../../hooks/use-posts-filters';
import { Input } from '@/components/ui/input';
import { IconSearch } from '@tabler/icons-react';

export const DashboardPostsView = () => {
  const [filters, setFilters] = usePostsFilters();

  return (
    <div className='flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4'>
      <div className='flex items-center justify-between'>
        <div className='relative w-full max-w-sm'>
          <IconSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search posts...'
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
            className='pl-9'
          />
        </div>
      </div>

      <Tabs 
        value={filters.type} 
        onValueChange={(value) => setFilters({ type: value as any, page: 1 })}
        className='w-full'
      >
        <TabsList>
          <TabsTrigger value='PHOTO'>Photos</TabsTrigger>
          <TabsTrigger value='ALBUM'>Albums</TabsTrigger>
          <TabsTrigger value='ARTICLE'>Articles</TabsTrigger>
        </TabsList>
        
        <div className='mt-4'>
            <ErrorBoundary fallback={<ErrorStatus />}>
                <Suspense fallback={<LoadingStatus />}>
                    <PostsList type={filters.type} />
                </Suspense>
            </ErrorBoundary>
        </div>
      </Tabs>
    </div>
  );
};
