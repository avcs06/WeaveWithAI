import { Section } from '@packages/ui/Section';
import React from 'react';

import { PageLayout } from '../components/PageLayout';

export default function HomePage() {
  return (
    <PageLayout>
      <Section title="Application starter" headingAs="h1">
        <p>
          React, Tailwind, vanilla-extract, Zustand, and React Query are ready.
        </p>
      </Section>
    </PageLayout>
  );
}
