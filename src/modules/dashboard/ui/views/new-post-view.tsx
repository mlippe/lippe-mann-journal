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
    <div>
      <div className='grid grid-cols-3 gap-2 sm:gap-3 md:flex md:flex-row md:gap-4'>
        <Link href='/dashboard/new/photo' className='block flex-1'>
          <Card className='h-full hover:bg-accent/50 active:scale-[0.98] transition-all cursor-pointer border-border/70 p-3 sm:p-4'>
            <CardContent className='p-0 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 text-center sm:text-left'>
              <IconPhotoPlus className='size-5 text-primary shrink-0' />
              <CardTitle className='text-xs sm:text-sm font-semibold'>
                + Foto
              </CardTitle>
            </CardContent>
          </Card>
        </Link>

        <Link href='/dashboard/new/album' className='block flex-1'>
          <Card className='h-full hover:bg-accent/50 active:scale-[0.98] transition-all cursor-pointer border-border/70 p-3 sm:p-4'>
            <CardContent className='p-0 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 text-center sm:text-left'>
              <IconPhotoVideo className='size-5 text-primary shrink-0' />
              <CardTitle className='text-xs sm:text-sm font-semibold'>
                + Album
              </CardTitle>
            </CardContent>
          </Card>
        </Link>

        <Link href='/dashboard/new/article' className='block flex-1'>
          <Card className='h-full hover:bg-accent/50 active:scale-[0.98] transition-all cursor-pointer border-border/70 p-3 sm:p-4'>
            <CardContent className='p-0 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 text-center sm:text-left'>
              <IconNotebook className='size-5 text-primary shrink-0' />
              <CardTitle className='text-xs sm:text-sm font-semibold'>
                + Artikel
              </CardTitle>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};
