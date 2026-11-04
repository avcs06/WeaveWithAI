import type { ReactNode } from 'react';

/** A page above this one: its name and its route. */
export type PageHeaderCrumb = { label: string; href: string };

export type PageHeaderProps = {
  /** The page's title, its only H1. */
  title: ReactNode;
  /** One muted line about the page. */
  description?: ReactNode;
  /** The pages above this one, from the top. The page itself is the title, not a crumb. */
  breadcrumb?: PageHeaderCrumb[];
  /** The page's own actions, such as Add, at the end of the title's row. */
  actions?: ReactNode;
};
