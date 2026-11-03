import { Paragraph } from '@packages/ui/Typography';
import { ChevronRight } from 'lucide-react';
import React from 'react';

import { NextLink } from '../NextLink';

import * as styles from './PageHeader.css';

import type { PageHeaderProps } from './PageHeader.types';

/**
 * The top of a page, the same on every page: the breadcrumb to the pages
 * above, the title as the page's only H1, a muted description, and the
 * page's actions at the end of the title's row.
 */
export const PageHeader = ({
  title,
  description,
  breadcrumb,
  actions,
}: PageHeaderProps) => (
  <header className="flex-col-gap-2">
    {breadcrumb?.length ? (
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <ul className="flex-row-gap-1 items-center flex-wrap">
          {breadcrumb.map((crumb) => (
            <li key={crumb.href} className="flex-row-gap-1 items-center">
              <NextLink href={crumb.href}>{crumb.label}</NextLink>
              <ChevronRight aria-hidden className={styles.separator} />
            </li>
          ))}
        </ul>
      </nav>
    ) : null}
    <div className="flex-row-gap-4 items-start">
      <div className="flex-col-gap-1 flex-fill-x">
        <h1 className={styles.title}>{title}</h1>
        {description ? <Paragraph color="muted">{description}</Paragraph> : null}
      </div>
      {actions ? (
        <div className="flex-row-gap-2 items-center shrink-0">{actions}</div>
      ) : null}
    </div>
  </header>
);
