'use client';

import { LinkIcon, UnlinkIcon } from 'lucide-react';
import React, { useCallback } from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useToolbar } from './toolbar-provider';
import { useEditorState } from '@tiptap/react';

const LinkToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();

    const editorState = useEditorState({
      editor,
      selector: (ctx) => ({
        isLink: ctx.editor.isActive('link'),
      }),
    });

    const setLink = useCallback(() => {
      const previousUrl = editor.getAttributes('link').href;
      const url = window.prompt('URL', previousUrl);

      // cancelled
      if (url === null) {
        return;
      }

      // empty
      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();

        return;
      }

      // update link
      try {
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({ href: url })
          .run();
      } catch (e) {
        alert((e as Error).message);
      }
    }, [editor]);

    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className={cn('h-8 w-8', className)}
              onClick={setLink}
              ref={ref}
              {...props}
            >
              {children || <LinkIcon className='h-4 w-4' />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Set Link</span>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className={cn('h-8 w-8', className)}
              onClick={(e) => {
                editor.chain().focus().unsetLink().run();
                onClick?.(e);
              }}
              disabled={!editorState.isLink}
              ref={ref}
              {...props}
            >
              {children || <UnlinkIcon className='h-4 w-4' />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Unlink</span>
          </TooltipContent>
        </Tooltip>
      </>
    );
  },
);

LinkToolbar.displayName = 'LinkToolbar';

export { LinkToolbar };
