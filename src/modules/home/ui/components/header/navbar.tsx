'use client';

import Logo from './logo';
import FlipLink from '@/components/flip-link';
import { ThemeSwitch } from '@/components/theme-toggle';
import { AnimatePresence, motion } from 'motion/react';

interface NavbarProps {
  isCollapsed?: boolean;
}

const Navbar = ({ isCollapsed = false }: NavbarProps) => {
  return (
    <nav>
      <div className='flex items-center pb-3 px-3.5 sm:px-4 relative'>
        <Logo isCollapsed={isCollapsed} />

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              key='nav-trailing-group'
              initial={{ opacity: 0, width: 0, x: -8 }}
              animate={{ opacity: 1, width: 'auto', x: 0 }}
              exit={{ opacity: 0, width: 0, x: -8 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className='overflow-hidden flex items-center shrink-0'
            >
              <div className='flex items-center gap-5 lg:gap-6 pl-4 lg:pl-6'>
                <div className='hidden lg:flex items-center gap-5 whitespace-nowrap'>
                  <FlipLink href='/?view=zine'>Feed</FlipLink>
                  <FlipLink href='/?view=grid'>Übersicht</FlipLink>
                  <FlipLink href='/collections'>Sammlungen</FlipLink>
                  <FlipLink href='/about'>Über</FlipLink>
                </div>
                <ThemeSwitch />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
