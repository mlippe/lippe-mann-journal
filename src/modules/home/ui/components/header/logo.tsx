'use client';

import Link from 'next/link';
import WordRotate from '../word-rotate';
import { siteConfig } from '@/site.config';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';

interface LogoProps {
  isCollapsed?: boolean;
}

const Logo = ({ isCollapsed = false }: LogoProps) => {
  return (
    <Link
      href='/'
      className='flex items-center group shrink-0'
      aria-label='Startseite'
    >
      <Image
        src='/lm_logo.svg'
        alt='Lippe-Mann Logo'
        width={32}
        height={32}
        className='size-4.5 grayscale-25 group-hover:grayscale-0 transition-all shrink-0'
      />
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key='brand-title'
            initial={{ opacity: 0, width: 0, x: -6 }}
            animate={{ opacity: 1, width: 'auto', x: 0 }}
            exit={{ opacity: 0, width: 0, x: -6 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className='overflow-hidden whitespace-nowrap'
          >
            <div className='pl-2 sm:pl-2.5'>
              <WordRotate
                label={siteConfig.title}
                label2={siteConfig.tagline}
                style='text-[13px] sm:text-sm font-medium uppercase tracking-[0.08em]'
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
};

export default Logo;
