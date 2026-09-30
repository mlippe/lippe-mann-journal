// External dependencies
import Link from 'next/link';

// Internal dependencies - UI Components
import { PiArrowUpRight } from 'react-icons/pi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { siteConfig } from '@/site.config';

const IntroCard = () => {
  return (
    <div className='flex justify-center -mx-3 mb-2 md:mb-4'>
      <Link
        href='/about'
        className='flex flex-col gap-2.5 p-3.5 sm:p-4 hover:bg-muted-foreground/5 transition-all rounded-xl duration-150 font-light relative group max-w-xl w-full'
      >
        <div className='flex items-center gap-3.5'>
          {/* AVATAR LEFT */}
          <Avatar className='size-11 sm:size-12 shrink-0'>
            <AvatarImage src={siteConfig.avatar} alt='Avatar' />
            <AvatarFallback>{siteConfig.initials}</AvatarFallback>
          </Avatar>

          {/* NAME RIGHT */}
          <div className='flex flex-col min-w-0 grow'>
            <div className='flex items-center justify-between'>
              <h1 className='text-sm sm:text-base font-medium tracking-tight text-foreground'>
                {siteConfig.name}
              </h1>
              <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground'>
                <PiArrowUpRight size={16} />
              </div>
            </div>
            <p className='-mt-0.5 text-[11px] sm:text-xs text-foreground/60 font-mono'>
              {siteConfig.role}
            </p>
          </div>
        </div>

        {/* BIO BELOW */}
        <p className='text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans'>
          {siteConfig.bio}
        </p>
      </Link>
    </div>
  );
};

export default IntroCard;
