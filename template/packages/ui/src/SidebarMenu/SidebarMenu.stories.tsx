import { LayoutDashboard, LogOut, Plus } from 'lucide-react';
import React, { useState } from 'react';

import { Avatar } from '../Avatar';
import { Button, IconButton } from '../Button';
import { Checkbox } from '../Checkbox';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText, sidebarFrame } from '../StoryStyles.css';
import { Tag } from '../Tag';
import { Truncate } from '../Truncate';

import { SidebarMenu, SidebarMenuItem } from '.';

import type { Meta, StoryObj } from '@storybook/react-vite';

export default { title: 'UI/SidebarMenu' } satisfies Meta;
// The page renders its own sidebar, so the story takes no args.
type Story = StoryObj;

const SidebarMenuStories = () => {
  const [header, setHeader] = useState(true);
  const [footer, setFooter] = useState(true);
  const [icons, setIcons] = useState(true);
  const [counts, setCounts] = useState(false);
  const [longLabels, setLongLabels] = useState(false);
  const [manyRows, setManyRows] = useState(false);
  const [current, setCurrent] = useState(0);

  const rows = Array.from({ length: manyRows ? 24 : 4 }, (_, i) => ({
    id: i,
    name: longLabels
      ? `Dashboard ${i + 1} for the spring conference planning team`
      : `Dashboard ${i + 1}`,
  }));

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        A sidebar&apos;s navigation on the frame&apos;s background: the header
        and footer keep their place, the rows between them scroll.
      </p>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={header} onCheckedChange={setHeader}>
            Header
          </Checkbox>
          <Checkbox checked={footer} onCheckedChange={setFooter}>
            Footer
          </Checkbox>
          <Checkbox checked={icons} onCheckedChange={setIcons}>
            Icons
          </Checkbox>
          <Checkbox checked={counts} onCheckedChange={setCounts}>
            Counts
          </Checkbox>
          <Checkbox checked={longLabels} onCheckedChange={setLongLabels}>
            Long labels
          </Checkbox>
          <Checkbox checked={manyRows} onCheckedChange={setManyRows}>
            Many rows
          </Checkbox>
        </div>
        <div className={sidebarFrame}>
          <SidebarMenu
            aria-label="Dashboards"
            header={
              header ? (
                <Button leftIcon={<Plus />} className="w-full">
                  Create
                </Button>
              ) : undefined
            }
            footer={
              footer ? (
                <div className="flex-row-gap-2 items-center min-w-0">
                  <Avatar size="sm" name="Ada Lovelace" />
                  <Truncate>ada@example.com</Truncate>
                  <IconButton tooltip="Sign out">
                    <LogOut />
                  </IconButton>
                </div>
              ) : undefined
            }
          >
            {rows.map((row) => (
              <SidebarMenuItem
                key={row.id}
                href={`/dashboards/${row.id}`}
                leftIcon={icons ? <LayoutDashboard /> : undefined}
                rightAddOn={counts ? <Tag>{row.id + 2}</Tag> : undefined}
                selected={row.id === current}
                onClick={(event) => {
                  event.preventDefault();
                  setCurrent(row.id);
                }}
              >
                {row.name}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <SidebarMenuStories /> };
