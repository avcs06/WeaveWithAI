'use client';

import { classNames } from '@packages/styles/classNames';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertCircle, Info, TriangleAlert } from 'lucide-react';
import React, { Fragment } from 'react';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary } from '../ErrorBoundary';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- Root's barrel loads next/font; a dialog's own root needs only the providers.
import { UIProviders } from '../Root/UIProviders';
import { hasContent } from '../utils';

import {
  confirmationSurface,
  confirmationText,
  dialogDescription,
  dialogFooter,
  dialogOverlay,
  dialogTitle,
} from './Dialog.css';
import { dialogRecipe, glyphRecipe } from './Dialog.recipes.css';

import type { ConfirmationDialogOptions } from './Dialog.types';
import type { DialogResult } from './result';

const glyphs = { error: AlertCircle, warning: TriangleAlert, info: Info };

const preventDefault = (event: Event) => event.preventDefault();

const ConfirmationDialog = ({
  title,
  content,
  status = 'warning',
  footer,
  portalled = true,
  className,
  closeDialog,
  returnFocusTo,
}: ConfirmationDialogOptions & {
  closeDialog: (result?: DialogResult) => void;
  returnFocusTo: HTMLElement | null;
}) => {
  const Glyph = glyphs[status];
  const Wrapper = portalled ? DialogPrimitive.Portal : Fragment;
  const hasDescription = hasContent(content);

  const surfaceClassName = dialogRecipe({ size: 'sm' });
  const glyphClassName = glyphRecipe({ status });

  return (
    // Open while it exists: only the footer closes it, by unmounting it.
    <DialogPrimitive.Root open>
      <Wrapper>
        <DialogPrimitive.Overlay
          data-slot="overlay"
          className={classNames(dialogOverlay, 'fixed inset-0')}
        />
        <DialogPrimitive.Content
          role="alertdialog"
          {...(hasDescription ? {} : { 'aria-describedby': undefined })}
          onEscapeKeyDown={preventDefault}
          onInteractOutside={preventDefault}
          // No trigger for Radix to return focus to: back to what had it.
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusTo?.focus();
          }}
          className={classNames(
            surfaceClassName,
            confirmationSurface,
            'flex-col-gap-0',
            'fixed inset-0 h-fit',
            className,
          )}
        >
          <div className="flex-row-gap-4 items-start">
            <span
              data-slot="glyph"
              className={classNames(
                glyphClassName,
                'grid place-items-center shrink-0',
              )}
            >
              <Glyph aria-hidden />
            </span>
            <div
              data-slot="text"
              className={classNames(
                confirmationText,
                'flex-col-gap-1 flex-fill-x',
              )}
            >
              <DialogPrimitive.Title className={dialogTitle}>
                {title}
              </DialogPrimitive.Title>
              {hasDescription && (
                <DialogPrimitive.Description className={dialogDescription}>
                  {content}
                </DialogPrimitive.Description>
              )}
            </div>
          </div>
          <div
            data-slot="footer"
            className={classNames(dialogFooter, 'flex-row-gap-2 justify-end')}
          >
            {footer(closeDialog)}
          </div>
        </DialogPrimitive.Content>
      </Wrapper>
    </DialogPrimitive.Root>
  );
};

/**
 * Asks a yes-or-no question over the page, like confirming a delete, and
 * resolves with the result the pressed footer button sends. Callable from
 * anywhere, React or not; on the server it resolves `undefined` at once.
 */
export const openConfirmationDialog = (options: ConfirmationDialogOptions) =>
  new Promise<DialogResult | undefined>((resolve) => {
    if (typeof document === 'undefined') {
      resolve(undefined);
      return;
    }

    const returnFocusTo =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    let isClosed = false;

    const closeDialog = (result?: DialogResult) => {
      if (isClosed) return;
      isClosed = true;
      resolve(result);
      // Not while React may still be rendering this root, as when it throws.
      setTimeout(() => {
        root.unmount();
        host.remove();
      });
    };

    root.render(
      <UIProviders>
        <ErrorBoundary fallback={null} onError={() => closeDialog()}>
          <ConfirmationDialog
            {...options}
            closeDialog={closeDialog}
            returnFocusTo={returnFocusTo}
          />
        </ErrorBoundary>
      </UIProviders>,
    );
  });
