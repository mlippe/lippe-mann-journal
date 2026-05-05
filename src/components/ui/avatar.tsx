'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import Image from 'next/image';

import { cn } from '@/lib/utils';

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot='avatar'
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  src,
  alt,
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  if (!src) return null;

  return (
    <div className={cn('aspect-square size-full relative', className)}>
      <Image
        src={src as string}
        alt={alt || 'Avatar'}
        fill
        sizes='(max-width: 768px) 64px, 120px'
        className='object-cover'
      />
    </div>
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot='avatar-fallback'
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
