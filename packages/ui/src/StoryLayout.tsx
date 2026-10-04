import React, { type ReactNode } from 'react';

import { sectionTitle } from './StoryStyles.css';

/** A story page: its sections, 32px apart. */
export const StoryPage = ({ children }: { children: ReactNode }) => (
  <div className="flex-col-gap-8">{children}</div>
);

/** A titled section of a story page: the title, then its content 12px below. */
export const StorySection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="flex-col-gap-3">
    <h4 className={sectionTitle}>{title}</h4>
    {children}
  </section>
);
