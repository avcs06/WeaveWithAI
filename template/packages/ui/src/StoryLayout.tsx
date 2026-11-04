import React, { type ReactNode } from 'react';

import { Section } from './Section';

export const StoryPage = ({ children }: { children: ReactNode }) => (
  <div className="flex-col-gap-8">{children}</div>
);

export const StorySection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => <Section title={title}>{children}</Section>;
