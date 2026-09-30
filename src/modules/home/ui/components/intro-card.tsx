// External dependencies
import Link from 'next/link';

// Internal dependencies - UI Components
import { ArrowUpRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { siteConfig } from '@/site.config';

const IntroCard = () => {
  return (
    <div className='w-full max-w-xl sm:max-w-2xl mx-auto mb-4 sm:mb-5'>
      <Link
        href='/about'
        className='group relative flex flex-col p-4 sm:p-5 rounded-2xl border border-border/40 hover:border-border/70 bg-muted/10 hover:bg-muted/20 transition-all duration-200 select-none shadow-2xs'
      >
        <div className='flex flex-col gap-3 sm:gap-3.5'>
          {/* Top: Avatar + Name / Role + Arrow */}
          <div className='flex items-center gap-3.5'>
            <Avatar className='size-12 sm:size-13 shrink-0 ring-1 ring-border/50 group-hover:ring-foreground/30 transition-all'>
              <AvatarImage src={siteConfig.avatar} alt={siteConfig.name} />
              <AvatarFallback className='text-xs font-mono font-medium'>
                {siteConfig.initials}
              </AvatarFallback>
            </Avatar>

            <div className='flex flex-col min-w-0 grow'>
              <div className='flex items-center justify-between gap-1'>
                <h1 className='text-base sm:text-[17px] font-semibold tracking-tight text-foreground truncate'>
                  {siteConfig.name}
                </h1>
                <ArrowUpRight className='size-4 sm:size-4.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0' />
              </div>
              <p className='text-xs sm:text-[13px] text-muted-foreground font-mono truncate'>
                {siteConfig.role}
              </p>
            </div>
          </div>

          {/* Eye-catching Bio */}
          <p className='text-base sm:text-lg md:text-[19px] text-foreground/90 font-sans leading-snug sm:leading-relaxed tracking-tight'>
            {siteConfig.bio}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default IntroCard;
