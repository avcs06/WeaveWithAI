'use client';

import { classNames } from '@packages/styles/classNames';
import { Slot } from '@radix-ui/react-slot';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { Image as ImageIcon } from 'lucide-react';
import React from 'react';

import { hasContent, useImageFailed } from '../utils';

import * as styles from './Image.css';

import type { ImageProps } from './Image.types';

/**
 * A picture in a box of its own width and height, which narrows with its
 * parent and keeps its ratio. `fit` covers the box or shows all of the
 * picture. Without `src`, or when the picture fails to load, `fallbackIcon`
 * sits in the middle of the box, an image icon unless given. With children,
 * the picture is the box's background and the children lie over it.
 *
 * @invalidAlternative img, import('next/image')
 */
export const Image = ({
  src,
  alt,
  width,
  height,
  fit,
  fallbackIcon,
  children,
  className,
  style,
  ...props
}: ImageProps) => {
  const image = useImageFailed(src);
  const shown = !!src && !image.failed;
  const px = (side: number | undefined) =>
    side === undefined ? undefined : `${side}px`;
  const ratio =
    width !== undefined && height !== undefined
      ? `${width} / ${height}`
      : undefined;

  if (hasContent(children)) {
    const background = styles.backgrounds[fit];
    // With a side left out, the content sets it: CSS can't read the picture's ratio.
    const vars = assignInlineVars({
      [styles.width]: px(width) ?? 'auto',
      [styles.height]: ratio ? 'auto' : (px(height) ?? 'auto'),
      [styles.ratio]: ratio ?? 'auto',
      ...(src && { [styles.picture]: `url("${src}")` }),
    });

    return (
      <div
        {...props}
        data-ds=""
        className={classNames('max-w-full', styles.box, background, className)}
        style={{ ...vars, ...style }}
      >
        {alt && (
          <span className="sr-only" data-ds="">
            {alt}
          </span>
        )}
        {children}
      </div>
    );
  }

  // With a side left out, the shown picture's own ratio sets it; a missing picture is square.
  const vars = assignInlineVars({
    [styles.width]:
      px(width) ?? (shown ? 'fit-content' : (px(height) ?? 'auto')),
    [styles.height]: width === undefined ? (px(height) ?? 'auto') : 'auto',
    [styles.ratio]: ratio ?? (shown ? 'auto' : '1'),
  });

  // In place of a missing picture, the box itself carries the alt text.
  const named = !shown && !!alt;
  return (
    <div
      {...props}
      role={named ? 'img' : undefined}
      aria-label={named ? alt : undefined}
      data-ds=""
      className={classNames(
        'relative overflow-hidden max-w-full',
        !shown && 'flex items-center justify-center',
        styles.box,
        className,
      )}
      style={{ ...vars, ...style }}
    >
      {shown ? (
        <img
          ref={image.ref}
          src={src}
          alt={alt}
          onError={image.onError}
          data-ds=""
          className={
            ratio
              ? classNames(
                  'absolute inset-0 w-full h-full',
                  fit === 'cover' ? 'object-cover' : 'object-contain',
                )
              : width === undefined
                ? 'block h-full w-auto'
                : 'block w-full h-auto'
          }
        />
      ) : (
        // The box sizes and colors the icon, whichever it is.
        <Slot
          aria-hidden
          data-ds=""
          className={classNames('h-auto', styles.icon)}
        >
          {fallbackIcon ?? <ImageIcon />}
        </Slot>
      )}
    </div>
  );
};
