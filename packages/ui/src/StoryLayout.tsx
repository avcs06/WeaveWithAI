import React, { type ReactNode } from 'react';

import { sectionTitle } from './StoryStyles.css';

export const StoryPage = ({ children }: { children: ReactNode }) => (
  <div className="flex-col-gap-8">{children}</div>
);

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
