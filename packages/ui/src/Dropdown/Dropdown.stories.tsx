import { ArrowRight } from 'lucide-react';
import React, { useState } from 'react';

import { StorySwitch } from '../StoryControls';
import { StoryPage, StorySection } from '../StoryLayout';

import { DropdownButton } from './auxiliary';

import type { Meta, StoryObj } from '@storybook/react-vite';

export default { title: 'UI/Dropdown' } satisfies Meta;
// The page renders its own buttons, so the story takes no args.
type Story = StoryObj;

const DropdownButtonStories = () => {
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const features = { disabled, loading };

  return (
    <StoryPage>
      <div className="flex-row-gap-4 flex-wrap">
        <StorySwitch
          label="disabled"
          checked={disabled}
          onChange={setDisabled}
        />
        <StorySwitch label="loading" checked={loading} onChange={setLoading} />
      </div>

      <StorySection title="DropdownButton">
        <div className="flex-row-gap-2 items-center flex-wrap">
          <DropdownButton {...features}>Actions</DropdownButton>
          <DropdownButton {...features} look="ghost" rightIcon={<ArrowRight />}>
            Other variant and icon
          </DropdownButton>
        </div>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <DropdownButtonStories /> };
