'use client';

import React from 'react';

import { PageHeader } from './PageHeader';

export const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex-col-gap-0 min-h-screen">
      <PageHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
};
