'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Graphic from '../../../../../components/graphic';
import MobileMenuButton from './mobile-menu-button';
import Navbar from './navbar';
import { useNavScrollCollapse } from './use-nav-scroll-collapse';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isCollapsed = useNavScrollCollapse({ disabled: isMobileMenuOpen });

  return (
    <header className='fixed top-3 lg:top-0 lg:pt-3 lg:left-3 left-0 z-50 bg-background rounded-br-[18px] before:absolute before:inset-x-0 before:-top-3 before:h-3 before:bg-background lg:before:hidden'>
      <div className='relative'>
        <Navbar isCollapsed={isCollapsed} />
        {/* MOBILE TOP BAR  */}
        <motion.div
          animate={
            isCollapsed && !isMobileMenuOpen
              ? { opacity: 0, y: -12, pointerEvents: 'none' as const }
              : { opacity: 1, y: 0, pointerEvents: 'auto' as const }
          }
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className='border-t-12 fixed top-0 left-0 w-full border-background block lg:hidden'
        />

        <div className='absolute lg:left-0 -bottom-4.5 size-4.5'>
          <Graphic />
        </div>

        <div className='absolute top-0 lg:-top-3 -right-4.5 size-4.5'>
          <Graphic />
        </div>
      </div>

      <MobileMenuButton
        isCollapsed={isCollapsed}
        onOpenChange={setIsMobileMenuOpen}
      />
    </header>
  );
};

export default Header;
