'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import Graphic from '../../../../../components/graphic';
import MobileMenuButton from './mobile-menu-button';
import Navbar from './navbar';
import { useNavScrollCollapse } from './use-nav-scroll-collapse';

const Header = () => {
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isScrollCollapsed = useNavScrollCollapse({ disabled: isMobileMenuOpen });
  const [isHovered, setIsHovered] = useState(false);
  const [isManuallyRevealed, setIsManuallyRevealed] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state during render if pathname changes or if scroll expands
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsManuallyRevealed(false);
    setIsHovered(false);
  }

  const [prevScrollCollapsed, setPrevScrollCollapsed] = useState(isScrollCollapsed);
  if (isScrollCollapsed !== prevScrollCollapsed) {
    setPrevScrollCollapsed(isScrollCollapsed);
    if (!isScrollCollapsed && isManuallyRevealed) {
      setIsManuallyRevealed(false);
    }
  }

  // When manually revealed via tap, dismiss on pointerdown outside or downward scroll
  useEffect(() => {
    if (!isManuallyRevealed) return;

    const handlePointerDownOutside = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsManuallyRevealed(false);
      }
    };

    const initialScrollY = window.scrollY;
    const handleScroll = () => {
      // Dismiss if user resumes scrolling down
      if (window.scrollY - initialScrollY > 20) {
        setIsManuallyRevealed(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isManuallyRevealed]);

  // Hover handlers for mouse/desktop
  const handlePointerEnter = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

  const handlePointerLeave = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 250);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard accessibility
  const handleFocusCapture = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleBlurCapture = useCallback((e: React.FocusEvent) => {
    if (!headerRef.current?.contains(e.relatedTarget as Node)) {
      setIsHovered(false);
    }
  }, []);

  const handleToggleManualReveal = useCallback(() => {
    setIsManuallyRevealed((prev) => !prev);
  }, []);

  const handleMobileMenuOpenChange = useCallback((open: boolean) => {
    setIsMobileMenuOpen(open);
    if (!open) {
      setIsManuallyRevealed(false);
    }
  }, []);

  const isEffectiveCollapsed =
    isScrollCollapsed && !isHovered && !isManuallyRevealed;

  return (
    <header
      ref={headerRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      className='fixed top-3 lg:top-0 lg:pt-3 lg:left-3 left-0 z-50 bg-background rounded-br-[18px] before:absolute before:inset-x-0 before:-top-3 before:h-3 before:bg-background lg:before:hidden'
    >
      <div className='relative'>
        <Navbar
          isCollapsed={isEffectiveCollapsed}
          isManuallyRevealed={isManuallyRevealed}
          onToggleManualReveal={handleToggleManualReveal}
        />
        {/* MOBILE TOP BAR  */}
        <motion.div
          animate={
            isEffectiveCollapsed && !isMobileMenuOpen
              ? { opacity: 0, y: -12, pointerEvents: 'none' as const }
              : { opacity: 1, y: 0, pointerEvents: 'auto' as const }
          }
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className='border-t-12 fixed top-0 left-0 w-full border-background block lg:hidden'
        />

        <div className='absolute lg:left-0 -bottom-4.5 size-4.5'>
          <Graphic />
        </div>

        {/* Desktop corner graphic (always aligned with viewport edge) */}
        <div className='hidden lg:block absolute -top-3 -right-4.5 size-4.5 pointer-events-none'>
          <Graphic />
        </div>

        {/* Mobile corner graphic (animates up to align with viewport edge when collapsed) */}
        <motion.div
          animate={{
            y: isEffectiveCollapsed ? -12 : 0,
          }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className='block lg:hidden absolute top-0 -right-4.5 size-4.5 pointer-events-none'
        >
          <Graphic />
        </motion.div>
      </div>

      <MobileMenuButton
        isCollapsed={isEffectiveCollapsed}
        onOpenChange={handleMobileMenuOpenChange}
      />
    </header>
  );
};

export default Header;
