'use client';

import { classNames } from '@packages/styles/classNames';
import { useOnChange } from '@packages/utils/hooks';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { AlertCircle, Info, TriangleAlert, X } from 'lucide-react';
import React, { useRef } from 'react';

import { Button, IconButton } from '../Button';
import { CheckIcon, LoadingIcon } from '../Icons';
import { Truncate } from '../Truncate';
import { hasContent } from '../utils';

import { announceToast, dismissToast, useToastStore } from './store';
import {
  toastDescription,
  toastSurface,
  toastText,
  toastTitle,
  toastViewport,
} from './Toast.css';
import { toastStatusRecipe } from './Toast.recipes.css';

import type { ToastEntry, ToastStatus } from './Toast.types';

const glyphs = {
  success: CheckIcon,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
  loading: LoadingIcon,
};

// What screen readers hear for the status icon.
const statusLabels: Partial<Record<ToastStatus, string>> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  loading: 'Loading',
};

const ToastItem = ({ id, open, config }: ToastEntry) => {
  const {
    title,
    description,
    status = 'info',
    icon,
    action,
    closable = status === 'error',
    duration,
  } = config;
  const titleRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const Glyph = glyphs[status];
  const label = statusLabels[status];
  const isUrgent = status === 'error' || status === 'warning';
  const statusClassName = toastStatusRecipe({ status });

  // Radix announces a toast only on show: updates go to the queue's regions.
  useOnChange(() => {
    const text = [
      label && `${label}:`,
      titleRef.current?.textContent,
      descriptionRef.current?.textContent,
    ];
    announceToast(text.filter(Boolean).join(' '), isUrgent);
  }, [title, description, status]);

  return (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) dismissToast(id);
      }}
      // Errors and warnings interrupt a screen reader; the rest wait.
      type={isUrgent ? 'foreground' : 'background'}
      // A loading toast stays until it's updated or dismissed.
      duration={duration ?? (status === 'loading' ? Infinity : undefined)}
      // Not a tab stop: Tab goes straight to its buttons.
      tabIndex={undefined}
      // A full stack scrolls instead of squeezing its toasts.
      className={classNames(
        toastSurface,
        'flex-row-gap-3 items-center shrink-0',
      )}
    >
      <span
        data-slot="status"
        className={classNames(
          statusClassName,
          'grid place-items-center shrink-0',
        )}
      >
        {icon ?? <Glyph aria-hidden />}
        {label && <span className="sr-only">{`${label}: `}</span>}
      </span>
      <div
        data-slot="text"
        className={classNames(toastText, 'flex-col-gap-1 flex-fill-x')}
      >
        <ToastPrimitive.Title ref={titleRef} className={toastTitle}>
          <Truncate>{title}</Truncate>
        </ToastPrimitive.Title>
        {hasContent(description) && (
          <ToastPrimitive.Description
            ref={descriptionRef}
            className={toastDescription}
          >
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      {action && (
        <ToastPrimitive.Action altText={action.altText} asChild>
          <Button variant="base" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </ToastPrimitive.Action>
      )}
      {closable && (
        <ToastPrimitive.Close asChild>
          <IconButton tooltip="Close" size="xs" variant="base" look="ghost">
            <X />
          </IconButton>
        </ToastPrimitive.Close>
      )}
    </ToastPrimitive.Root>
  );
};

/**
 * Shows the toasts `toast()` adds, newest at the bottom. UIRoot renders it
 * once; another would show every toast twice.
 *
 * @internal
 */
export const ToastQueue = () => {
  const toasts = useToastStore('toasts');
  const announcement = useToastStore('announcement');

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {/* Always mounted, so changes are read; a new key rereads the same text. */}
      <div role="status" className="sr-only">
        {announcement && !announcement.isUrgent && (
          <span key={announcement.key}>{announcement.text}</span>
        )}
      </div>
      <div role="alert" className="sr-only">
        {announcement?.isUrgent && (
          <span key={announcement.key}>{announcement.text}</span>
        )}
      </div>
      {toasts.map((entry) => (
        <ToastItem key={entry.id} {...entry} />
      ))}
      {/* Radix appends each toast as it opens: the newest is at the bottom. */}
      <ToastPrimitive.Viewport
        // Toasts slide and swipe past the screen's right edge: no sideways
        // scrollbar.
        className={classNames(
          toastViewport,
          'flex-col-gap-2',
          'fixed right-0 bottom-0 m-0',
          'overflow-x-hidden',
        )}
      />
    </ToastPrimitive.Provider>
  );
};
