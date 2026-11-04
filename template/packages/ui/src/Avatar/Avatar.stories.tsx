import React, { useState } from 'react';

import { Checkbox } from '../Checkbox';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText } from '../StoryStyles.css';

import { Avatar } from './Avatar';
import { avatarRecipe } from './Avatar.recipes.css';

import type { Meta, StoryObj } from '@storybook/react-vite';

const avatarSizes = Object.keys(avatarRecipe.classNames.variants.size) as Array<
  keyof typeof avatarRecipe.classNames.variants.size
>;

const photo = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(210 55% 55%)"/><circle cx="32" cy="25" r="12" fill="white" fill-opacity="0.85"/><rect x="10" y="42" width="44" height="32" rx="16" fill="white" fill-opacity="0.85"/></svg>',
)}`;

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Avatar>;

export default meta;
// The page renders its own avatars, so the story takes no args.
type Story = StoryObj;

const Labelled = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex-col-gap-2 items-center">
    {children}
    <span className={`${caption} ${mutedText}`}>{label}</span>
  </div>
);

const AvatarStories = () => {
  const [withPhoto, setWithPhoto] = useState(false);

  return (
    <StoryPage>
      <StorySection title="Sizes">
        <Checkbox checked={withPhoto} onCheckedChange={setWithPhoto}>
          Photo
        </Checkbox>
        <div className="flex-row-gap-6 items-end">
          {avatarSizes.map((size) => (
            <Labelled key={size} label={size}>
              <Avatar
                size={size}
                name="Ada Lovelace"
                src={withPhoto ? photo : undefined}
              />
            </Labelled>
          ))}
        </div>
      </StorySection>

      <StorySection title="Content">
        <div className="flex-row-gap-6 flex-wrap">
          <Labelled label="two words">
            <Avatar name="Ada Lovelace" />
          </Labelled>
          <Labelled label="one word">
            <Avatar name="Plato" />
          </Labelled>
          <Labelled label="empty name">
            <Avatar name="" />
          </Labelled>
          <Labelled label="photo">
            <Avatar name="Grace Hopper" src={photo} />
          </Labelled>
          <Labelled label="broken photo">
            <Avatar name="Grace Hopper" src="/missing-photo.png" />
          </Labelled>
        </div>
      </StorySection>

      {/* Hidden from screen readers by default: the name beside it is read. */}
      <StorySection title="Beside a name">
        <div className="flex-row-gap-2 items-center">
          <Avatar size="sm" name="Ada Lovelace" />
          <span>Ada Lovelace</span>
        </div>
      </StorySection>

      <StorySection title="On its own (aria-hidden={false})">
        <div className="flex-row-gap-2 items-center">
          <Avatar name="Ada Lovelace" aria-hidden={false} />
          <Avatar name="Grace Hopper" aria-hidden={false} />
          <Avatar name="Alan Turing" aria-hidden={false} />
        </div>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <AvatarStories /> };
