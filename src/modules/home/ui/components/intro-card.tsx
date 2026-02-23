// External dependencies
import Link from 'next/link';

// Internal dependencies - UI Components
import { PiArrowUpRight } from 'react-icons/pi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { siteConfig } from '@/site.config';

const IntroCard = () => {
  return (
    <div className='flex justify-center'>
      <Link
        href='/about'
        className='flex flex-col justify-between gap-6 p-6 bg-muted/50 hover:bg-muted-foreground/10 transition-all duration-150 ease-[cubic-bezier(0.22, 1, 0.36, 1)] rounded-xl font-light relative group h-full max-w-3xl w-full'
      >
        <div className='flex gap-4 items-center'>
          {/* AVATAR  */}
          <Avatar className='size-15'>
            <AvatarImage src={siteConfig.avatar} alt='Avatar' />
            <AvatarFallback>{siteConfig.initials}</AvatarFallback>
          </Avatar>

          {/* NAME  */}
          <div className='flex flex-col'>
            <h1 className='text-lg'>{siteConfig.name}</h1>
            <p className='-mt-0.5 text-sm text-text-muted'>{siteConfig.role}</p>
          </div>
        </div>

        <div className='lg:mt-4 xl:mt-0'>
          <p className='text-text-muted text-base'>{siteConfig.bio}</p>
        </div>

        <div className='absolute top-8 right-8 opacity-0 group-hover:top-6 group-hover:right-6 group-hover:opacity-100 transition-all duration-300 ease-in-out'>
          <PiArrowUpRight size={18} />
        </div>
      </Link>
    </div>
  );
};

export default IntroCard;
