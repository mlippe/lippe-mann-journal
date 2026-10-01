'use client';

import React, { useState } from 'react';
import Graphic from '../../../../../components/graphic';
import MobileMenu from './mobile-menu';
import { AnimatePresence, motion } from 'motion/react';

const MobileMenuButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type='button'
        aria-label={isOpen ? 'Menü schließen' : 'Menü öffnen'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className='fixed top-3 right-0 lg:right-3 z-50 bg-background rounded-bl-[18px] lg:hidden cursor-pointer select-none'
      >
        <div className='relative pb-3 px-4'>
          <AnimatePresence mode='wait' initial={false}>
            <motion.span
              key={isOpen ? 'close' : 'menu'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className='text-sm font-medium whitespace-nowrap block text-foreground'
            >
              {isOpen ? 'Schließen' : 'Menü'}
            </motion.span>
          </AnimatePresence>
          <Graphic className='absolute -bottom-4.5 right-0 rotate-90 size-4.5 pointer-events-none' />
          <Graphic className='absolute -left-4.5 top-0 rotate-90 size-4.5 pointer-events-none' />
        </div>
      </button>

      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default MobileMenuButton;

