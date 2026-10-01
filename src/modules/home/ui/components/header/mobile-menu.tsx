'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { siteConfig } from '@/site.config';

interface MenuItem {
  label: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { label: 'Feed', href: '/?view=zine' },
  { label: 'Übersicht', href: '/?view=grid' },
  { label: 'Sammlungen', href: '/collections' },
  { label: 'Über dieses Journal', href: '/about' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: Props) {
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
  }, [isOpen]);

  const handleExitComplete = () => {
    document.body.style.overflow = '';
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className='fixed inset-0 z-40 lg:hidden bg-background p-3 overscroll-contain'
          style={{ willChange: 'opacity', transform: 'translateZ(0)' }}
        >
          <div className='bg-muted h-full flex flex-col justify-between rounded-[18px] overflow-hidden'>
            {/* Header */}
            <div className='relative p-6 pr-28'>
              <div className='flex gap-4 items-center'>
                {/* AVATAR  */}
                <Avatar className='size-14 shrink-0'>
                  <AvatarImage src={siteConfig.avatar} alt='Avatar' />
                  <AvatarFallback>{siteConfig.initials}</AvatarFallback>
                </Avatar>

                {/* NAME  */}
                <div className='flex flex-col'>
                  <span className='text-[17px] font-medium tracking-tight text-foreground'>
                    {siteConfig.name}
                  </span>
                  <p className='text-xs font-mono text-muted-foreground mt-0.5'>
                    {siteConfig.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className='overflow-y-auto px-4 py-2 scrollbar-none overscroll-contain'>
              {menuItems.map((item) => (
                <motion.button
                  key={item.label}
                  onClick={() => handleNavigation(item.href)}
                  className='w-full text-left px-4 py-3.5 rounded-xl mb-2 flex items-center justify-between bg-background/70 hover:bg-background text-foreground text-[15px] sm:text-base font-medium tracking-[0.01em] border border-border/40 transition-colors cursor-pointer'
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{item.label}</span>
                  <ArrowRight size={16} className='text-muted-foreground' />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

