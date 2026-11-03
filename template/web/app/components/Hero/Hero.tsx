import { classNames } from '@packages/styles/classNames';
import React from 'react';

import * as styles from './Hero.css';

import type { HeroProps } from './Hero.types';

/**
 * The first section of the landing page,
 * `web/app/(routes)/(marketing)/page.tsx` at `/`. It holds the headline as
 * the page's only H1, the line under it and the actions, with the preview
 * beside them. It spans the main region and draws the brand's background.
 * Its content keeps the page's edge.
 */
export const Hero = ({
  title,
  description,
  actions,
  media,
  className,
}: HeroProps) => (
  <header data-hero="" className={classNames(styles.hero, className)}>
    <div
      className={
        media ? classNames(styles.split, 'grid gap-10 items-center') : undefined
      }
    >
      <div className="flex-col-gap-6 items-start">
        <div className="flex-col-gap-3">
          <h1 data-slot="hero-title" className={styles.title}>
            {title}
          </h1>
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex-row-gap-3 flex-wrap items-center">{actions}</div>
        ) : null}
      </div>
      {media ? <div className="min-w-0">{media}</div> : null}
    </div>
  </header>
);
