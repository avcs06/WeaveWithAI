'use client';

import { classNames } from '@packages/styles/classNames';
import { useControlledValue } from '@packages/utils/hooks';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import React from 'react';

import { Menu } from '../Menu';
import { useIsDisabled } from '../utils';

import { PopoverButton } from './auxiliary';
import { PopoverProvider } from './context';
import { popover } from './Popover.css';

import type { PopoverProps } from './Popover.types';

// Between the trigger and the content, and kept from the viewport's edges.
const sideOffset = 4;
const collisionPadding = 8;
// Radix sets it on the content it places: the content never outgrows the
// space left.
const availableHeight = 'var(--radix-popover-content-available-height)';

/**
 * Radix Popover's behavior in Menu's shell. A disabled or loading popover
 * never opens, even controlled open, and keeps the caller's value for when
 * it's enabled again.
 */
const PopoverInner = ({
  children,
  menu,
  align = 'end',
  open,
  defaultOpen = false,
  onOpenChange,
  modal = false,
  menuClassName,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...state
}: PopoverProps) => {
  const [isOpen, setOpen] = useControlledValue(open, defaultOpen, onOpenChange);
  const { isDisabled } = useIsDisabled(state);

  return (
    <PopoverProvider {...state}>
      <PopoverPrimitive.Root
        modal={modal}
        open={isOpen && !isDisabled}
        onOpenChange={(next) => {
          if (!isDisabled) setOpen(next);
        }}
      >
        <PopoverPrimitive.Trigger asChild disabled={isDisabled || undefined}>
          {children}
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            asChild
            align={align}
            sideOffset={sideOffset}
            collisionPadding={collisionPadding}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
          >
            <Menu
              data-slot="popover"
              availableHeight={availableHeight}
              className={classNames(popover, 'z-popover', menuClassName)}
            >
              {menu}
            </Menu>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </PopoverProvider>
  );
};

/**
 * A panel of the caller's own content opened from a button: a filter form, a
 * details card, a quick edit. A non-modal dialog by default: focus moves in
 * on open and back to the trigger on close; Escape, a click outside or
 * tabbing out closes it.
 *
 * @invalidAlternative import('@radix-ui/react-popover')
 * @invalidAlternative [popover], [popovertarget], [popoverTarget], [popovertargetaction], [popoverTargetAction]
 * @invalidAlternative button[aria-haspopup="dialog"], Button[aria-haspopup="dialog"], IconButton[aria-haspopup="dialog"], PlainButton[aria-haspopup="dialog"]
 */
export const Popover = Object.assign(PopoverInner, { Button: PopoverButton });
