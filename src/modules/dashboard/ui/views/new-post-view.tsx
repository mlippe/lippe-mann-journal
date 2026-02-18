'use client';

import { Card, CardContent, CardTitle } from '@/components/ui/card';

import {
  IconNotebook,
  IconPhotoPlus,
  IconPhotoVideo,
} from '@tabler/icons-react';
import Link from 'next/link';

export const NewPostView = () => {
  return (
    <div className='px-4 md:px-8 py-4 md:py-6'>
      <div className='flex flex-wrap gap-5'>
        <Link href='/dashboard/new/photo'>
          <Card className='w-fit cursor-pointer hover:bg-white'>
            <CardContent className='flex gap-2 items-center'>
              <IconPhotoPlus />
              <CardTitle className='text-lg'>New Photo</CardTitle>
            </CardContent>
          </Card>
        </Link>

        <Link href='/dashboard/new/album'>
          <Card className='w-fit cursor-pointer hover:bg-white'>
            <CardContent className='flex gap-2 items-center'>
              <IconPhotoVideo />
              <CardTitle className='text-lg'>New Photo Album</CardTitle>
            </CardContent>
          </Card>
        </Link>

        <Link href='/dashboard/new/article'>
          <Card className='w-fit cursor-pointer hover:bg-white'>
            <CardContent className='flex gap-2 items-center'>
              <IconNotebook />
              <CardTitle className='text-lg'>New Article</CardTitle>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};
