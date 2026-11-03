import { Section } from '@packages/ui/Section';
import React from 'react';

import { PageHeader } from '../components/PageHeader';
import { layouts, PageLayout } from '../components/PageLayout';

export default function HomePage() {
  return (
    <PageLayout layout={layouts.marketing} header={<PageHeader />}>
      <Section title="Application starter" headingAs="h1">
        <p>
          React, Tailwind, vanilla-extract, Zustand, and React Query are ready.
        </p>
      </Section>
    </PageLayout>
  );
}
