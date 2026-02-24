import { siteConfig } from '@/site.config';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import clsx from 'clsx';

const Author = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <div className='relative inline-block overflow-hidden'>
      <Link
        href='/about'
        className={clsx(
          'flex items-center',
          size === 'sm' && 'gap-2',
          size === 'md' && 'gap-4',
        )}
      >
        {/* AVATAR  */}
        <Avatar
          className={clsx(
            size === 'sm' && 'size-8',
            size === 'md' && 'size-15',
          )}
        >
          <AvatarImage src={siteConfig.avatar} alt='Avatar' />
          <AvatarFallback>{siteConfig.initials}</AvatarFallback>
        </Avatar>

        {/* NAME  */}
        <div className='flex flex-col'>
          <h1
            className={clsx(
              size === 'sm' && 'text-sm font-medium whitespace-nowrap',
              size === 'md' && 'text-lg',
            )}
          >
            {siteConfig.name}
          </h1>
          <p
            className={clsx(
              'text-text-muted',
              size === 'sm' && 'hidden',
              size === 'md' && '-mt-0.5 text-sm',
            )}
          >
            {siteConfig.role}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default Author;
