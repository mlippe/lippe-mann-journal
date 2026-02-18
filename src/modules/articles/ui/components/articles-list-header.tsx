'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusIcon, XCircle } from 'lucide-react';

import { DEFAULT_PAGE } from '@/constants';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useArticlesFilters } from '../../hooks/use-articles-filters';
import { ArticlesSearchFilter } from './articles-search-filter';

export const ArticlesListHeader = () => {
  const [filters, setFilters] = useArticlesFilters();

  const isAnyFilterModified = !!filters.search;

  const onClearFilters = () => {
    setFilters({
      search: '',
      page: DEFAULT_PAGE,
    });
  };

  return (
    <div className='py-4 px-4 md:px-8 flex flex-col gap-y-8'>
      <div>
        <h1 className='text-2xl font-bold'>Articles</h1>
        <p className='text-muted-foreground '>
          Here&apos;s a list of your articles
        </p>
      </div>
      <div className='flex items-center justify-between'>
        <ScrollArea>
          <div className='flex items-center gap-x-2 p-1'>
            <ArticlesSearchFilter />
            {isAnyFilterModified && (
              <Button onClick={onClearFilters} variant='outline' size='sm'>
                <XCircle />
                Clear
              </Button>
            )}
          </div>
          <ScrollBar orientation='horizontal' />
        </ScrollArea>
        <Button asChild>
          <Link href='/dashboard/new/article'>
            <PlusIcon />
            New Article
          </Link>
        </Button>
      </div>
    </div>
  );
};
