import React, { useState } from 'react';

import { StorySwitch } from '../StoryControls';
import { StoryPage, StorySection } from '../StoryLayout';
import { mutedText } from '../StoryStyles.css';

import { ErrorBoundary } from './ErrorBoundary';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'UI/ErrorBoundary',
  component: ErrorBoundary,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
// The page renders its own boundaries, so the story takes no args.
type Story = StoryObj;

const Chart = ({ broken }: { broken: boolean }) => {
  if (broken) throw new Error('Chart data is malformed');
  return <p>Revenue by month</p>;
};

const ErrorBoundaryStories = () => {
  const [broken, setBroken] = useState(false);

  return (
    <StoryPage>
      <StorySwitch label="Child throws" checked={broken} onChange={setBroken} />

      {/* Keyed on the switch: turning it off remounts the boundary. */}
      <StorySection title="Default fallback">
        <ErrorBoundary key={String(broken)}>
          <Chart broken={broken} />
        </ErrorBoundary>
      </StorySection>

      <StorySection title="Custom fallback">
        <ErrorBoundary
          key={String(broken)}
          fallback={<p className={mutedText}>Couldn&apos;t load the chart.</p>}
        >
          <Chart broken={broken} />
        </ErrorBoundary>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <ErrorBoundaryStories /> };
