'use client';

import { classNames } from '@packages/styles/classNames';
import { useControlledValue } from '@packages/utils/hooks';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import React, { useId, useRef } from 'react';

import { IconButton } from '../Button';
import { FlexScrollArea } from '../ScrollArea';
import { Truncate } from '../Truncate';
import { hasContent, tabbable, useIconAddon } from '../utils';

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
  leftIcon,
  rightIcon,
  leftAddOn,
  rightAddOn,
  description,
  headerAction,
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
  const titleId = useId();
  const openerRef = useRef<HTMLElement | null>(null);
  const close = () => setOpen(false);
  const blockUnlessClosable = (event: Event) => {
    if (!closable) event.preventDefault();
  };

  const { leftSlot, rightSlot } = useIconAddon({
    leftIcon,
    rightIcon,
    leftAddOn,
    rightAddOn,
  });

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
          className={classNames(dialogOverlay, 'fixed inset-0')}
        />
        <DialogPrimitive.Content
          // Radix points to a description even when there's none.
          {...(hasDescription ? {} : { 'aria-describedby': undefined })}
          onEscapeKeyDown={blockUnlessClosable}
          onInteractOutside={blockUnlessClosable}
          // Radix refocuses only its own trigger: back to whatever opened it.
          onOpenAutoFocus={(event) => {
            openerRef.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
            // The body's first control, not the header's close button; with
            // none, the dialog itself, which reads its name.
            event.preventDefault();
            const dialog = event.currentTarget as HTMLElement;
            const body = dialog.querySelector('[data-slot="body-content"]');
            (body?.querySelector<HTMLElement>(tabbable) ?? dialog).focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            openerRef.current?.focus();
          }}
          className={classNames(
            surfaceClassName,
            'flex-col-gap-0',
            'fixed inset-0 h-fit',
            className,
          )}
        >
          <div
            data-slot="header"
            className={classNames(dialogHeader, 'flex-row-gap-4 items-start')}
          >
            <div className="flex-col-gap-1 flex-fill-x">
              <DialogPrimitive.Title
                className={classNames(
                  dialogTitle,
                  'flex-row-gap-2 items-center',
                )}
              >
                {leftSlot}
                {/* Its id names the body; Radix keeps the title's own. */}
                <Truncate id={titleId} className="min-w-0">
                  {title}
                </Truncate>
                {rightSlot}
              </DialogPrimitive.Title>
              {hasDescription && (
                <DialogPrimitive.Description className={dialogDescription}>
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            {(hasContent(headerAction) || closable) && (
              <div
                data-slot="header-actions"
                className="flex-row-gap-2 items-center shrink-0"
              >
                {headerAction}
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
            )}
          </div>
          {hasContent(children) && (
            <FlexScrollArea
              orientation="vertical"
              // Named for when it takes focus to scroll.
              aria-labelledby={titleId}
              data-slot="body"
            >
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
