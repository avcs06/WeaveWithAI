import { Copy, Link, Pencil, Trash2, UserPlus } from 'lucide-react';
import React, { type ReactNode, useState } from 'react';

import { Avatar } from '../Avatar';
import { Checkbox } from '../Checkbox';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText } from '../StoryStyles.css';

import { Menu, MenuGroup, MenuItem, MenuLabel, MenuSeparator } from '.';

import type { Meta, StoryObj } from '@storybook/react-vite';

export default { title: 'UI/Menu' } satisfies Meta;
// The page renders its own menus, so the story takes no args.
type Story = StoryObj;

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex-col-gap-2">
    <p className={`${caption} ${mutedText}`}>{label}</p>
    <div className="flex-row-gap-4 items-start flex-wrap">{children}</div>
  </div>
);

const MenuStories = () => {
  const [leftIcon, setLeftIcon] = useState(true);
  const [rightAddOn, setRightAddOn] = useState(false);
  const [selected, setSelected] = useState(false);
  const [nested, setNested] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [longLabel, setLongLabel] = useState(false);

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        Menu is the look of menus: Dropdown and Select render their content with
        it. These are its parts alone, without menu behavior.
      </p>

      <StorySection title="Parts">
        <Row label="Groups with labels, separators, and a submenu row">
          <Menu>
            <MenuGroup>
              <MenuLabel>Edit</MenuLabel>
              <MenuItem leftIcon={<Pencil />}>Rename</MenuItem>
              <MenuItem leftIcon={<Copy />} rightAddOn={<kbd>⌘D</kbd>}>
                Duplicate
              </MenuItem>
            </MenuGroup>
            <MenuGroup>
              <MenuLabel>Share</MenuLabel>
              <MenuItem leftIcon={<Link />}>Copy link</MenuItem>
              <MenuItem leftIcon={<UserPlus />} nested>
                Invite
              </MenuItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuItem leftIcon={<Trash2 />}>Delete</MenuItem>
          </Menu>
        </Row>
      </StorySection>

      <StorySection title="Rows">
        <Row label="Selected, nested, disabled, loading, and a label cut to one line">
          <Menu>
            <MenuItem selected>Newest first</MenuItem>
            <MenuItem>Oldest first</MenuItem>
            <MenuItem nested>More sorting</MenuItem>
            <MenuItem data-disabled>Unavailable</MenuItem>
            <MenuItem loading>Syncing</MenuItem>
            <MenuItem>
              A label long enough to be cut, shown in full on hover
            </MenuItem>
          </Menu>
          <Menu>
            {[
              ['Ada Lovelace', 'Custom content grows the row'],
              ['Grace Hopper', 'It is never clipped'],
            ].map(([name, detail]) => (
              <MenuItem key={name}>
                <div className="flex-row-gap-2 items-center">
                  <Avatar name={name} size="sm" />
                  <div>
                    <div>{name}</div>
                    <div className={mutedText}>{detail}</div>
                  </div>
                </div>
              </MenuItem>
            ))}
          </Menu>
        </Row>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={leftIcon} onCheckedChange={setLeftIcon}>
            Left icon
          </Checkbox>
          <Checkbox checked={rightAddOn} onCheckedChange={setRightAddOn}>
            Right add-on
          </Checkbox>
          <Checkbox checked={selected} onCheckedChange={setSelected}>
            Selected
          </Checkbox>
          <Checkbox checked={nested} onCheckedChange={setNested}>
            Nested
          </Checkbox>
          <Checkbox checked={disabled} onCheckedChange={setDisabled}>
            Disabled
          </Checkbox>
          <Checkbox checked={loading} onCheckedChange={setLoading}>
            Loading
          </Checkbox>
          <Checkbox checked={longLabel} onCheckedChange={setLongLabel}>
            Long label
          </Checkbox>
        </div>
        <Menu>
          {['Rename', 'Duplicate', 'Archive'].map((label) => (
            <MenuItem
              key={label}
              leftIcon={leftIcon ? <Pencil /> : undefined}
              rightAddOn={rightAddOn ? <kbd>⌘R</kbd> : undefined}
              selected={selected}
              nested={nested}
              data-disabled={disabled || undefined}
              loading={loading}
            >
              {longLabel
                ? `${label} every file in the shared folder for the spring conference`
                : label}
            </MenuItem>
          ))}
        </Menu>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <MenuStories /> };
