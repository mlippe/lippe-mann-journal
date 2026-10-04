'use client';

import React, { useState } from 'react';
import Graphic from '../../../../../components/graphic';
import MobileMenu from './mobile-menu';
import { AnimatePresence, motion } from 'motion/react';

interface MobileMenuButtonProps {
  isCollapsed?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

const MobileMenuButton = ({
  isCollapsed = false,
  isOpen: controlledIsOpen,
  onOpenChange,
}: MobileMenuButtonProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(next);
    }
    onOpenChange?.(next);
  };

  const handleClose = () => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(false);
    }
    onOpenChange?.(false);
  };

  return (
    <>
      <motion.button
        type='button'
        aria-label={isOpen ? 'Menü schließen' : 'Menü öffnen'}
        aria-expanded={isOpen}
        onClick={handleToggle}
        animate={
          isCollapsed && !isOpen
            ? { x: 60, opacity: 0, pointerEvents: 'none' as const }
            : { x: 0, opacity: 1, pointerEvents: 'auto' as const }
        }
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
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
      </motion.button>

      <MobileMenu isOpen={isOpen} onClose={handleClose} />
    </>
  );
};

export default MobileMenuButton;
