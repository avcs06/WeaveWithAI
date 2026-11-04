import React from 'react';

import { CheckIcon } from './CheckIcon';
import { LoadingIcon } from './LoadingIcon';
import { MinusIcon } from './MinusIcon';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { StoryPage, StorySection } from '../StoryLayout';

const meta = {
  title: 'UI/Icons',
} satisfies Meta;

export default meta;
type Story = StoryObj;

const row = { display: 'flex', alignItems: 'center', gap: 24 } as const;

export const Overview: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="LoadingIcon">
        {/* Spins; sized like any lucide icon. Label it when it stands alone. */}
        <div style={row}>
          <LoadingIcon size={16} role="img" aria-label="Loading" />
          <LoadingIcon size={24} role="img" aria-label="Loading" />
          <LoadingIcon size={32} role="img" aria-label="Loading" />
        </div>
      </StorySection>
      <StorySection title="CheckIcon">
        <div style={row}>
          <CheckIcon size={16} role="img" aria-label="Checked" />
          <CheckIcon size={24} role="img" aria-label="Checked" />
          <CheckIcon size={32} role="img" aria-label="Checked" />
        </div>
      </StorySection>
      <StorySection title="MinusIcon">
        <div style={row}>
          <MinusIcon size={16} role="img" aria-label="Partly checked" />
          <MinusIcon size={24} role="img" aria-label="Partly checked" />
          <MinusIcon size={32} role="img" aria-label="Partly checked" />
        </div>
      </StorySection>
    </StoryPage>
  ),
};
