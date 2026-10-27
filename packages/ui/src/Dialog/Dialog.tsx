'use client';

import { classNames } from '@packages/styles/classNames';
import { useControlledValue } from '@packages/utils/hooks';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import React from 'react';

import { IconButton } from '../Button';
import { FlexScrollArea } from '../ScrollArea';
import { hasContent } from '../utils';

import {
  dialogBody,
  dialogDescription,
  dialogFooter,
  dialogHeader,
  dialogOverlay,
  dialogTitle,
} from './Dialog.css';
import { dialogRecipe } from './Dialog.recipes.css';

import type { DialogProps } from './Dialog.types';

/**
 * A task over the page that waits until it's done or dismissed: editing a
 * session, inviting a speaker. Its children are the body, which scrolls
 * between the title and the footer's actions. A yes-or-no question is
 * openConfirmationDialog.
 *
 * @invalidAlternative dialog, [role="dialog"], [aria-modal="true"]
 * @invalidAlternative import('@radix-ui/react-dialog')
 */
export const Dialog = ({
  title,
  description,
  children,
  footer,
  trigger,
  open,
  defaultOpen = false,
  onOpenChange,
  closable = true,
  size,
  className,
}: DialogProps) => {
  const [isOpen, setOpen] = useControlledValue(open, defaultOpen, onOpenChange);
  const close = () => setOpen(false);
  // Escape and a press outside close a closable dialog only.
  const blockUnlessClosable = (event: Event) => {
    if (!closable) event.preventDefault();
  };

  const hasDescription = hasContent(description);
  const footerContent = typeof footer === 'function' ? footer(close) : footer;
  const surfaceClassName = dialogRecipe({ size });

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      {trigger && (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      )}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="overlay"
          className={dialogOverlay}
        />
        <DialogPrimitive.Content
          // Without a description, nothing describes it.
          {...(hasDescription ? {} : { 'aria-describedby': undefined })}
          onEscapeKeyDown={blockUnlessClosable}
          onInteractOutside={blockUnlessClosable}
          className={classNames(surfaceClassName, 'flex-col-gap-0', className)}
        >
          <div
            data-slot="header"
            className={classNames(dialogHeader, 'flex-row-gap-4 items-start')}
          >
            <div className="flex-col-gap-1 flex-fill-x">
              <DialogPrimitive.Title className={dialogTitle}>
                {title}
              </DialogPrimitive.Title>
              {hasDescription && (
                <DialogPrimitive.Description className={dialogDescription}>
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            {closable && (
              <DialogPrimitive.Close asChild>
                <IconButton
                  tooltip="Close"
                  size="xs"
                  variant="base"
                  look="ghost rounded"
                >
                  <X />
                </IconButton>
              </DialogPrimitive.Close>
            )}
          </div>
          {hasContent(children) && (
            <FlexScrollArea orientation="vertical" data-slot="body">
              <div data-slot="body-content" className={dialogBody}>
                {children}
              </div>
            </FlexScrollArea>
          )}
          {hasContent(footerContent) && (
            <div
              data-slot="footer"
              className={classNames(dialogFooter, 'flex-row-gap-2 justify-end')}
            >
              {footerContent}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
