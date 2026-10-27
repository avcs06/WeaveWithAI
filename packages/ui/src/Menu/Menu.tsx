'use client';

import { classNames } from '@packages/styles/classNames';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { ChevronRight } from 'lucide-react';
import React from 'react';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- shared styles for the icon at the end of a trigger.
import { controlIcon } from '../Button/Button.recipes.css';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- the checkbox's look, for rows that show one.
import { checkboxRecipe } from '../Checkbox/Checkbox.recipes.css';
import { CheckIcon } from '../Icons';
import { FlexScrollArea } from '../ScrollArea';
import { Tooltip } from '../Tooltip';
import { useTruncation } from '../Truncate';
import { useIconAddon } from '../utils';

import {
  menu,
  menuAvailableHeight,
  menuCheck,
  menuChevron,
  menuGroup,
  menuItem,
  menuLabel,
  menuList,
  menuSeparator,
} from './Menu.css';

import type {
  MenuGroupProps,
  MenuItemProps,
  MenuLabelProps,
  MenuProps,
  MenuSeparatorProps,
} from './Menu.types';

/**
 * The shell; its list scrolls inside the shell's max height. A `header`, like
 * a search field, sits above the list, outside the menu.
 *
 * @internal
 */
export const Menu = ({
  availableHeight,
  loading,
  header,
  style,
  className,
  children,
  ...props
}: MenuProps) => {
  // With a header, the menu's role, id and name move to the list, which
  // holds only the rows: a menu can't hold a field.
  const {
    role,
    id,
    'aria-orientation': orientation,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...shellProps
  } = props;

  const listSemantics = {
    role,
    id,
    'aria-orientation': orientation,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-busy': loading || undefined,
  };

  return (
    <div
      {...(header
        ? shellProps
        : { ...props, 'aria-busy': loading || undefined })}
      style={{
        ...(availableHeight &&
          assignInlineVars({ [menuAvailableHeight]: availableHeight })),
        ...style,
      }}
      // Hovering a row focuses it too, which would show the keyboard's ring:
      // the ring shows only while the keyboard is in use.
      onPointerMove={(event) => {
        event.currentTarget.dataset.pointer = '';
        props.onPointerMove?.(event);
      }}
      onKeyDownCapture={(event) => {
        delete event.currentTarget.dataset.pointer;
        props.onKeyDownCapture?.(event);
      }}
      className={classNames(menu, 'flex-col-gap-1.5', className)}
    >
      {header}
      {/* Takes the rows' height until the shell's max height, then scrolls;
          with nothing focusable in it, it takes a tab stop to scroll. */}
      <FlexScrollArea orientation="vertical">
        <div
          {...(header && listSemantics)}
          data-slot="list"
          className={classNames(menuList, 'flex-col-gap-0.5')}
        >
          {children}
        </div>
      </FlexScrollArea>
    </div>
  );
};

/**
 * A row's look: icon, label, add-ons and the check of a selected row, for
 * rows inside a Popover's content. It has no behavior of its own: wrap it in
 * a PlainButton to press it. A menu of actions or choices is a Dropdown,
 * whose rows bring menu roles and arrow keys.
 */
export const MenuItem = ({
  leftIcon,
  rightIcon,
  leftAddOn,
  rightAddOn,
  loading,
  selected,
  checkbox = false,
  checkmark = true,
  nested = false,
  tooltip,
  role,
  className,
  children,
  ...props
}: MenuItemProps) => {
  const {
    ref: labelRef,
    className: labelClassName,
    truncated,
  } = useTruncation<HTMLSpanElement>(children);

  const chevronClassName = controlIcon();
  const checkboxClassName = checkboxRecipe({ size: 'sm' });

  const { leftSlot, rightSlot } = useIconAddon({
    leftIcon,
    rightIcon,
    leftAddOn,
    rightAddOn,
    loading,
  });

  const hasCheckbox = checkbox && selected !== undefined;
  const hasCheck = Boolean(selected && checkmark);

  return (
    <Tooltip tooltip={[truncated && children, tooltip]} description={tooltip}>
      <div
        {...props}
        role={role}
        // `selected` in the attribute the row's role has. A menuitem has no
        // checked state: the chosen one is the current one.
        aria-selected={role === 'option' ? selected : undefined}
        aria-checked={
          role === 'menuitemradio' || role === 'menuitemcheckbox'
            ? selected
            : undefined
        }
        aria-current={(role === 'menuitem' && selected) || undefined}
        data-slot="item"
        data-left={leftSlot || hasCheckbox ? true : undefined}
        data-right={rightSlot || hasCheck || nested ? true : undefined}
        data-selected={selected || undefined}
        aria-busy={loading || undefined}
        className={classNames(
          menuItem,
          'flex-row-gap-2.5 items-center',
          className,
        )}
      >
        {hasCheckbox && (
          <span
            aria-hidden
            data-slot="checkbox"
            data-state={selected ? 'checked' : 'unchecked'}
            className={classNames(
              checkboxClassName,
              'grid place-items-center shrink-0',
            )}
          >
            {selected && <CheckIcon aria-hidden data-slot="icon" />}
          </span>
        )}
        {leftSlot}
        <span
          ref={labelRef}
          data-slot="label"
          className={classNames(labelClassName, 'flex-fill-x')}
        >
          {children}
        </span>
        {rightSlot}
        {hasCheck && (
          <CheckIcon
            aria-hidden
            data-slot="check"
            className={classNames(menuCheck, 'shrink-0')}
          />
        )}
        {nested && (
          <ChevronRight
            aria-hidden
            data-slot="chevron"
            className={classNames(chevronClassName, menuChevron, 'shrink-0')}
          />
        )}
      </div>
    </Tooltip>
  );
};

/** Rows of a Popover's content kept together, set apart from the next group. */
export const MenuGroup = ({ className, ...props }: MenuGroupProps) => (
  <div
    {...props}
    data-slot="group"
    className={classNames(menuGroup, 'flex-col-gap-0.5', className)}
  />
);

/** @internal */
export const MenuLabel = ({ className, ...props }: MenuLabelProps) => (
  <div
    {...props}
    data-slot="group-label"
    className={classNames(menuLabel, className)}
  />
);

/** @internal */
export const MenuSeparator = ({ className, ...props }: MenuSeparatorProps) => (
  <div
    {...props}
    data-slot="separator"
    className={classNames(menuSeparator, className)}
  />
);
