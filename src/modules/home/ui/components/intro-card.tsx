// External dependencies
import Link from 'next/link';

// Internal dependencies - UI Components
import { PiArrowUpRight } from 'react-icons/pi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { siteConfig } from '@/site.config';

const IntroCard = () => {
  return (
    <div className='flex justify-center -mx-3'>
      <Link
        href='/about'
        className='flex flex-col justify-between gap-6 p-6 hover:bg-muted-foreground/10 transition-all rounded-2xl duration-150 ease-[cubic-bezier(0.22, 1, 0.36, 1)] font-light relative group h-full max-w-3xl w-full'
      >
        <div className='flex gap-3 items-center flex-col'>
          {/* AVATAR  */}
          <Avatar className='size-20'>
            <AvatarImage src={siteConfig.avatar} alt='Avatar' />
            <AvatarFallback>{siteConfig.initials}</AvatarFallback>
          </Avatar>

          {/* NAME  */}
          <div className='flex flex-col items-center'>
            <h1 className='text-base font-medium'>{siteConfig.name}</h1>
            <p className='-mt-0.5 text-xs text-foreground/70 font-medium'>
              {siteConfig.role}
            </p>
          </div>
        </div>

        <div className='lg:mt-4 xl:mt-0'>
          <p className='text-center text-foreground text-lg'>
            {siteConfig.bio}
          </p>
        </div>

        <div className='absolute top-8 right-8 opacity-0 group-hover:top-6 group-hover:right-6 group-hover:opacity-100 transition-all duration-300 ease-in-out'>
          <PiArrowUpRight size={18} />
        </div>
      </Link>
    </div>
  );
};

export default IntroCard;
