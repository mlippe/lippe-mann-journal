'use client';

import { CollectionsList } from '../components/collections-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const DashboardCollectionsView = () => {
  return (
    <div className='py-4 px-4 md:px-8 flex flex-col gap-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Collections</h1>
          <p className='text-sm text-muted-foreground'>
            Manage your photo and article collections.
          </p>
        </div>
        <Button asChild>
          <Link href='/dashboard/collections/new'>
            <Plus className='mr-2 h-4 w-4' />
            New Collection
          </Link>
        </Button>
      </div>

      <CollectionsList />
    </div>
  );
};
