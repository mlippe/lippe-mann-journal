'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import WordRotate from '../word-rotate';
import FlipLink from '@/components/flip-link';
import { ThemeSwitch } from '@/components/theme-toggle';
import { siteConfig } from '@/site.config';
import { AnimatePresence, motion } from 'motion/react';

interface NavbarProps {
  isCollapsed?: boolean;
  isManuallyRevealed?: boolean;
  onToggleManualReveal?: () => void;
}

const Navbar = ({
  isCollapsed = false,
  isManuallyRevealed = false,
  onToggleManualReveal,
}: NavbarProps) => {
  const wasCollapsedOnPointerDown = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      wasCollapsedOnPointerDown.current = isCollapsed;
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    // If navbar is collapsed, was collapsed when touch started, or is manually revealed:
    // toggle the manual reveal state instead of navigating to home
    if (isCollapsed || wasCollapsedOnPointerDown.current || isManuallyRevealed) {
      e.preventDefault();
      e.stopPropagation();
      wasCollapsedOnPointerDown.current = false;
      onToggleManualReveal?.();
    }
  };

  const ariaLabel = isCollapsed
    ? 'Navigation einblenden'
    : isManuallyRevealed
      ? 'Navigation ausblenden'
      : 'Startseite';

  return (
    <nav className='pb-3 px-3.5 sm:px-4'>
      <div className='flex items-center h-6 relative'>
        {/* Permanent Anchor: The Lip Icon with fixed row height so it never shifts vertically */}
        <Link
          href='/'
          onClick={handleLogoClick}
          onPointerDown={handlePointerDown}
          className='flex items-center justify-center shrink-0 group size-6'
          aria-label={ariaLabel}
          title={ariaLabel}
        >
          <Image
            src='/lm_logo.svg'
            alt='Lippe-Mann Logo'
            width={32}
            height={32}
            className='size-4.5 grayscale-25 group-hover:grayscale-0 transition-all shrink-0'
          />
        </Link>

        {/* Single Unified Collapsible Section: Brand Title + Links + ThemeSwitch */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              key='nav-collapsible-content'
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{
                opacity: 0,
                width: 0,
                transition: {
                  opacity: { duration: 0.16, ease: 'easeOut' },
                  width: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              transition={{
                opacity: { duration: 0.22, ease: 'easeOut' },
                width: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
              }}
              className='overflow-hidden flex items-center shrink-0 h-6'
            >
              <div className='flex items-center h-full whitespace-nowrap pl-2.5 sm:pl-3'>
                {/* Brand Title: Lippe-Mann Journal */}
                <Link
                  href='/'
                  className='flex items-center h-full group select-none pr-5 sm:pr-6'
                  aria-label='Startseite'
                >
                  <WordRotate
                    label={siteConfig.title}
                    label2={siteConfig.tagline}
                    style='text-[13px] sm:text-sm font-medium uppercase tracking-[0.08em]'
                  />
                </Link>

                {/* Desktop Navigation Links */}
                <div className='hidden lg:flex items-center gap-5 pr-5 lg:pr-6 h-full'>
                  <FlipLink href='/?view=zine'>Feed</FlipLink>
                  <FlipLink href='/?view=grid'>Übersicht</FlipLink>
                  <FlipLink href='/collections'>Sammlungen</FlipLink>
                  <FlipLink href='/about'>Über</FlipLink>
                </div>

                {/* Mode Switcher */}
                <div className='flex items-center h-full'>
                  <ThemeSwitch />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
