/* eslint-disable @next/next/no-img-element */
'use client';

import Image from '@tiptap/extension-image';
import {
  mergeAttributes,
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from '@tiptap/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  Maximize,
  MoreVertical,
  Trash,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn, duplicateContent } from '@/lib/utils';
import { keyToUrl } from '@/modules/s3/lib/key-to-url';
import { useTRPC } from '@/trpc/client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import BlurImage from '@/components/blur-image';

export const ImageExtension = Image.extend({
  group: 'block',
  content: 'inline*',
  isolating: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
      },
      height: {
        default: null,
      },
      align: {
        default: 'center',
      },
      blurhash: {
        default: null,
      },
      aspectRatio: {
        default: null,
      },
      originalWidth: {
        default: null,
      },
      originalHeight: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
        contentElement: 'figcaption',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const img = element.querySelector('img');
          if (!img) return false;

          const width = element.style.width || img.getAttribute('width');
          const align =
            element.getAttribute('data-align') ||
            element.style.textAlign ||
            'center';

          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width: width,
            align: align,
            blurhash: img.getAttribute('data-blurhash'),
            aspectRatio: img.getAttribute('data-aspect-ratio'),
            originalWidth: img.getAttribute('data-original-width'),
            originalHeight: img.getAttribute('data-original-height'),
          };
        },
      },
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const {
      width,
      align,
      blurhash,
      aspectRatio,
      originalWidth,
      originalHeight,
      ...rest
    } = HTMLAttributes;
    const style = [];

    if (width) {
      style.push(`width: ${typeof width === 'number' ? width + 'px' : width}`);
    }

    if (align === 'center') {
      style.push('margin-left: auto; margin-right: auto');
    } else if (align === 'right') {
      style.push('margin-left: auto; margin-right: 0');
    } else if (align === 'left') {
      style.push('margin-left: 0; margin-right: auto');
    }

    return [
      'figure',
      {
        style: style.join('; '),
        'data-align': align,
      },
      [
        'img',
        mergeAttributes(this.options.HTMLAttributes, rest, {
          src: keyToUrl(rest.src),
          width: '100%',
          style: 'width: 100%; height: auto;',
          'data-blurhash': blurhash,
          'data-aspect-ratio': aspectRatio,
          'data-original-width': originalWidth,
          'data-original-height': originalHeight,
        }),
      ],
      ['figcaption', 0],
    ];
  },

  addNodeView: () => {
    return ReactNodeViewRenderer(TiptapImage);
  },
});

function TiptapImage(props: NodeViewProps) {
  const { node, editor, selected, deleteNode, updateAttributes } = props;
  const trpc = useTRPC();
  const deleteFile = useMutation(trpc.s3.deleteFile.mutationOptions());
  const imageRef = useRef<HTMLImageElement | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [resizing, setResizing] = useState(false);
  const [resizingPosition, setResizingPosition] = useState<'left' | 'right'>(
    'left',
  );
  const [resizeInitialWidth, setResizeInitialWidth] = useState(0);
  const [resizeInitialMouseX, setResizeInitialMouseX] = useState(0);

  const [openedMore, setOpenedMore] = useState(false);

  const rawSrc = node.attrs.src as string | null | undefined;
  const imageSrc = keyToUrl(rawSrc);

  const handleDeleteImage = useCallback(async () => {
    if (
      typeof rawSrc === 'string' &&
      !rawSrc.startsWith('http://') &&
      !rawSrc.startsWith('https://') &&
      !rawSrc.startsWith('data:')
    ) {
      try {
        await deleteFile.mutateAsync({ key: rawSrc });
        toast.success('Image deleted successfully');
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete image',
        );
      }
    }

    deleteNode();
  }, [deleteFile, rawSrc, deleteNode]);

  function handleResizingPosition({
    e,
    position,
  }: {
    e: React.MouseEvent<HTMLDivElement, MouseEvent>;
    position: 'left' | 'right';
  }) {
    startResize(e);
    setResizingPosition(position);
  }

  function startResize(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();

    setResizing(true);

    setResizeInitialMouseX(event.clientX);
    if (imageRef.current) {
      setResizeInitialWidth(imageRef.current.offsetWidth);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function resize(event: MouseEvent) {
    if (!resizing) {
      return;
    }

    let dx = event.clientX - resizeInitialMouseX;
    if (resizingPosition === 'left') {
      dx = resizeInitialMouseX - event.clientX;
    }

    const newWidth = Math.max(resizeInitialWidth + dx, 150); // Minimum width: 150
    const parentWidth = nodeRef.current?.parentElement?.offsetWidth || 0; // Get the parent element's width

    if (newWidth < parentWidth) {
      updateAttributes({
        width: newWidth,
      });
    }
  }

  function endResize() {
    setResizing(false);
    setResizeInitialMouseX(0);
    setResizeInitialWidth(0);
  }

  function handleTouchStart(
    event: React.TouchEvent,
    position: 'left' | 'right',
  ) {
    event.preventDefault();

    setResizing(true);
    setResizingPosition(position);

    setResizeInitialMouseX(event.touches[0].clientX);
    if (imageRef.current) {
      setResizeInitialWidth(imageRef.current.offsetWidth);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function handleTouchMove(event: TouchEvent) {
    if (!resizing) {
      return;
    }

    let dx = event.touches[0].clientX - resizeInitialMouseX;
    if (resizingPosition === 'left') {
      dx = resizeInitialMouseX - event.touches[0].clientX;
    }

    const newWidth = Math.max(resizeInitialWidth + dx, 150);
    const parentWidth = nodeRef.current?.parentElement?.offsetWidth || 0;

    if (newWidth < parentWidth) {
      updateAttributes({
        width: newWidth,
      });
    }
  }

  function handleTouchEnd() {
    setResizing(false);
    setResizeInitialMouseX(0);
    setResizeInitialWidth(0);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // Mouse events
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', endResize);
    // Touch events
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', endResize);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    resizing,
    resizeInitialMouseX,
    resizeInitialWidth,
    resize,
    handleTouchMove,
  ]);

  return (
    <NodeViewWrapper
      ref={nodeRef}
      className={cn(
        'relative flex flex-col rounded-md border-2 border-transparent',
        selected ? 'border-blue-300' : '',
        node.attrs.align === 'left' && 'left-0 translate-x-0',
        node.attrs.align === 'center' && 'left-1/2 -translate-x-1/2',
        node.attrs.align === 'right' && 'left-full -translate-x-full',
      )}
      style={{ width: node.attrs.width, maxWidth: '100%' }}
    >
      <div
        className={cn(
          'group relative flex flex-col rounded-md',
          resizing && '',
        )}
      >
        <div
          className='relative w-full overflow-hidden rounded-md'
          style={{
            aspectRatio: node.attrs.aspectRatio || undefined,
          }}
        >
          {node.attrs.blurhash ? (
            <BlurImage
              src={imageSrc}
              alt={node.attrs.alt || ''}
              title={node.attrs.title || ''}
              blurhash={node.attrs.blurhash}
              aspectRatio={node.attrs.aspectRatio}
              width={node.attrs.originalWidth}
              height={node.attrs.originalHeight}
              className='w-full h-auto'
            />
          ) : (
            <img
              ref={imageRef}
              src={imageSrc}
              alt={node.attrs.alt}
              title={node.attrs.title}
              className='max-w-full h-auto'
            />
          )}
        </div>
        <figcaption className='text-center mt-2'>
          <NodeViewContent />
        </figcaption>

        {editor?.isEditable && (
          <>
            <div
              className='absolute inset-y-0 z-20 flex w-[25px] cursor-col-resize items-center justify-start p-2'
              style={{ left: 0 }}
              onMouseDown={(event) => {
                handleResizingPosition({ e: event, position: 'left' });
              }}
              onTouchStart={(event) => handleTouchStart(event, 'left')}
            >
              <div className='z-20 h-[70px] w-1 rounded-xl border bg-[rgba(0,0,0,0.65)] opacity-0 transition-all group-hover:opacity-100' />
            </div>
            <div
              className='absolute inset-y-0 z-20 flex w-[25px] cursor-col-resize items-center justify-end p-2'
              style={{ right: 0 }}
              onMouseDown={(event) => {
                handleResizingPosition({ e: event, position: 'right' });
              }}
              onTouchStart={(event) => handleTouchStart(event, 'right')}
            >
              <div className='z-20 h-[70px] w-1 rounded-xl border bg-[rgba(0,0,0,0.65)] opacity-0 transition-all group-hover:opacity-100' />
            </div>
            <div
              className={cn(
                'absolute right-4 top-4 flex items-center gap-1 rounded-md border bg-background p-1 opacity-0 transition-opacity',
                !resizing && 'group-hover:opacity-100',
                openedMore && 'opacity-100',
              )}
            >
              <Button
                type='button'
                size='icon'
                className={cn(
                  'size-7',
                  node.attrs.align === 'left' && 'bg-accent',
                )}
                variant='ghost'
                onClick={() => {
                  updateAttributes({
                    align: 'left',
                  });
                }}
              >
                <AlignLeft className='size-4' />
              </Button>
              <Button
                type='button'
                size='icon'
                className={cn(
                  'size-7',
                  node.attrs.align === 'center' && 'bg-accent',
                )}
                variant='ghost'
                onClick={() => {
                  updateAttributes({
                    align: 'center',
                  });
                }}
              >
                <AlignCenter className='size-4' />
              </Button>
              <Button
                type='button'
                size='icon'
                className={cn(
                  'size-7',
                  node.attrs.align === 'right' && 'bg-accent',
                )}
                variant='ghost'
                onClick={() => {
                  updateAttributes({
                    align: 'right',
                  });
                }}
              >
                <AlignRight className='size-4' />
              </Button>
              <Separator orientation='vertical' className='h-[20px]' />
              <DropdownMenu
                open={openedMore}
                onOpenChange={(val) => {
                  setOpenedMore(val);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    type='button'
                    size='icon'
                    className='size-7'
                    variant='ghost'
                  >
                    <MoreVertical className='size-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='start'
                  alignOffset={-90}
                  className='mt-1 text-sm'
                >
                  <DropdownMenuItem
                    onClick={() => {
                      duplicateContent(editor);
                    }}
                  >
                    <Copy className='mr-2 size-4' /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      updateAttributes({
                        width: 'fit-content',
                      });
                    }}
                  >
                    <Maximize className='mr-2 size-4' /> Full Screen
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className='text-destructive focus:text-destructive'
                    onClick={handleDeleteImage}
                  >
                    <Trash className='mr-2 size-4' /> Delete Image
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
