'use client';

import { classNames } from '@packages/styles/classNames';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { Image as ImageIcon } from 'lucide-react';
import React from 'react';

import { hasContent, useImageFailed } from '../utils';

import * as styles from './Image.css';

import type { ImageProps } from './Image.types';

/**
 * A picture in a box of its own width and height, which narrows with its
 * parent and keeps its ratio. `fit` covers the box or shows all of the
 * picture. Without `src`, or when the picture fails to load, an image icon
 * sits in the middle of the box. With children, the picture is the box's
 * background and the children lie over it.
 *
 * @invalidAlternative img, import('next/image')
 */
export const Image = ({
  src,
  alt,
  width,
  height,
  fit,
  children,
  className,
  style,
  ...props
}: ImageProps) => {
  const image = useImageFailed(src);
  const shown = !!src && !image.failed;
  const vars = assignInlineVars({
    [styles.width]: `${width}px`,
    [styles.ratio]: `${width} / ${height}`,
    ...(src && { [styles.picture]: `url("${src}")` }),
  });

  if (hasContent(children)) {
    const background = styles.backgrounds[fit];
    return (
      <div
        {...props}
        data-ds=""
        className={classNames(styles.box, background, className)}
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

  // In place of a missing picture, the box itself carries the alt text.
  const named = !shown && !!alt;
  return (
    <div
      {...props}
      role={named ? 'img' : undefined}
      aria-label={named ? alt : undefined}
      data-ds=""
      className={classNames(
        'relative overflow-hidden',
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
          className={classNames(
            'absolute inset-0 w-full h-full',
            fit === 'cover' ? 'object-cover' : 'object-contain',
          )}
        />
      ) : (
        <ImageIcon
          aria-hidden
          data-ds=""
          className={classNames('h-auto', styles.icon)}
        />
      )}
    </div>
  );
};
