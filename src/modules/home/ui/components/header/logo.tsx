'use client';

import Link from 'next/link';
import WordRotate from '../word-rotate';
import { siteConfig } from '@/site.config';
import Image from 'next/image';

const Logo = () => {
  return (
    <Link
      href='/'
      className='flex items-center group shrink-0'
      aria-label='Startseite'
    >
      <div className='flex items-center justify-center shrink-0 size-6'>
        <Image
          src='/lm_logo.svg'
          alt='Lippe-Mann Logo'
          width={32}
          height={32}
          className='size-4.5 grayscale-25 group-hover:grayscale-0 transition-all shrink-0'
        />
      </div>
      <div className='pl-2 sm:pl-2.5 flex items-center'>
        <WordRotate
          label={siteConfig.title}
          label2={siteConfig.tagline}
          style='text-[13px] sm:text-sm font-medium uppercase tracking-[0.08em]'
        />
      </div>
    </Link>
  );
};

export default Logo;
