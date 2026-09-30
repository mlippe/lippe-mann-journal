// External dependencies
import Link from 'next/link';

// Internal dependencies - UI Components
import { ArrowUpRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { siteConfig } from '@/site.config';

const IntroCard = () => {
  return (
    <div className='w-full max-w-xl mx-auto mb-4 sm:mb-5'>
      <Link
        href='/about'
        className='group relative flex flex-col justify-between p-4 sm:p-5 rounded-xl border border-border/40 hover:border-border/80 bg-muted/10 hover:bg-muted/25 transition-all duration-200 select-none'
      >
        <div className='flex flex-col gap-3'>
          {/* Top: Avatar + Name / Role + Arrow */}
          <div className='flex items-center gap-3.5'>
            <Avatar className='size-11 sm:size-12 shrink-0 ring-1 ring-border/50 group-hover:ring-foreground/30 transition-all'>
              <AvatarImage src={siteConfig.avatar} alt={siteConfig.name} />
              <AvatarFallback className='text-xs font-mono font-medium'>
                {siteConfig.initials}
              </AvatarFallback>
            </Avatar>

            <div className='flex flex-col min-w-0 grow'>
              <div className='flex items-center justify-between gap-1'>
                <h1 className='text-sm sm:text-base font-semibold tracking-tight text-foreground truncate'>
                  {siteConfig.name}
                </h1>
                <ArrowUpRight className='size-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0' />
              </div>
              <p className='text-[11px] sm:text-xs text-muted-foreground font-mono truncate'>
                {siteConfig.role}
              </p>
            </div>
          </div>

          {/* Bio */}
          <p className='text-xs sm:text-[13px] text-foreground/80 leading-relaxed font-sans'>
            {siteConfig.bio}
          </p>
        </div>

        {/* Subtle bottom meta */}
        <div className='pt-3 mt-2 border-t border-border/25 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-muted-foreground/70 group-hover:text-muted-foreground transition-colors'>
          <span>Journal & Archiv</span>
          <span className='group-hover:translate-x-0.5 transition-transform'>Über mich →</span>
        </div>
      </Link>
    </div>
  );
};

export default IntroCard;
