import React, { useState } from 'react';

import { Checkbox } from '../Checkbox';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText } from '../StoryStyles.css';

import { Image } from './Image';

import type { ImageFit } from './Image.types';
import type { Meta, StoryObj } from '@storybook/react-vite';

// Square, so a wide box shows how each fit treats a picture of another ratio.
const square = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(210 55% 55%)"/><circle cx="32" cy="32" r="20" fill="white" fill-opacity="0.85"/></svg>',
)}`;

const meta = {
  title: 'UI/Image',
  component: Image,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Image>;

export default meta;
// The page renders its own images, so the story takes no args.
type Story = StoryObj;

const fits: ImageFit[] = ['cover', 'contain'];

const Labelled = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex-col-gap-2">
    {children}
    <span className={`${caption} ${mutedText}`}>{label}</span>
  </div>
);

const ImageStories = () => {
  const [withPicture, setWithPicture] = useState(true);
  const src = withPicture ? square : undefined;

  return (
    <StoryPage>
      <StorySection title="Fit">
        <Checkbox checked={withPicture} onCheckedChange={setWithPicture}>
          Picture
        </Checkbox>
        <div className="flex-row-gap-6 flex-wrap">
          {fits.map((fit) => (
            <Labelled key={fit} label={fit}>
              <Image src={src} alt="A circle" width={320} height={180} fit={fit} />
            </Labelled>
          ))}
        </div>
      </StorySection>

      <StorySection title="No picture">
        <div className="flex-row-gap-6 flex-wrap">
          <Labelled label="no src">
            <Image alt="No picture yet" width={240} height={160} fit="cover" />
          </Labelled>
          <Labelled label="broken src">
            <Image
              src="/missing-picture.png"
              alt="A broken picture"
              width={240}
              height={160}
              fit="cover"
            />
          </Labelled>
          <Labelled label="small box">
            <Image alt="A small box" width={48} height={48} fit="cover" />
          </Labelled>
        </div>
      </StorySection>

      <StorySection title="In a narrower parent">
        <div className="flex-col-gap-2" style={{ width: 200 }}>
          <Image src={src} alt="A circle" width={320} height={180} fit="cover" />
          <span className={`${caption} ${mutedText}`}>
            320 × 180 in 200px: narrower, same ratio
          </span>
        </div>
      </StorySection>

      <StorySection title="With children: the picture as background">
        <Image
          src={src}
          alt=""
          width={960}
          height={240}
          fit="cover"
          className="flex-row-gap-0 items-center justify-center"
        >
          <span>Content over the picture</span>
        </Image>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <ImageStories /> };
