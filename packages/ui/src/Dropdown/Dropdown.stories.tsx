import {
  ArrowRight,
  Copy,
  Link,
  Mail,
  Pencil,
  Trash2,
  UserPlus,
} from 'lucide-react';
import React, { type ReactNode, useState } from 'react';

import { Checkbox } from '../Checkbox';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText } from '../StoryStyles.css';

import { Dropdown } from '.';

import type { Meta, StoryObj } from '@storybook/react-vite';

export default { title: 'UI/Dropdown' } satisfies Meta;
// The page renders its own dropdowns, so the story takes no args.
type Story = StoryObj;

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex-col-gap-2">
    <p className={`${caption} ${mutedText}`}>{label}</p>
    <div className="flex-row-gap-2 items-center flex-wrap">{children}</div>
  </div>
);

const people = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Turing',
  'Katherine Johnson',
];

/** Dropdown.Search filtering the items it sits above. */
const PeopleMenu = () => {
  const [search, setSearch] = useState('');
  const matches = people.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Dropdown
      align="start"
      menu={
        <>
          <Dropdown.Search
            aria-label="Search people"
            placeholder="Search people"
            value={search}
            onChange={setSearch}
          />
          {matches.map((name) => (
            <Dropdown.Item key={name}>{name}</Dropdown.Item>
          ))}
        </>
      }
    >
      <Dropdown.Button>Assign</Dropdown.Button>
    </Dropdown>
  );
};

const shareMenu = (
  <Dropdown.SubMenu
    menu={
      <>
        <Dropdown.Group label="Links">
          <Dropdown.Item leftIcon={<Link />}>Copy link</Dropdown.Item>
          <Dropdown.Item leftIcon={<Mail />}>Email link</Dropdown.Item>
        </Dropdown.Group>
        <Dropdown.Separator />
        <Dropdown.Item
          leftIcon={<UserPlus />}
          disabledWithReason="You need permission to invite people"
        >
          Invite people
        </Dropdown.Item>
      </>
    }
  >
    <Dropdown.Item>Share</Dropdown.Item>
  </Dropdown.SubMenu>
);

const DropdownStories = () => {
  const [search, setSearch] = useState(false);
  const [groups, setGroups] = useState(true);
  const [subMenu, setSubMenu] = useState(true);
  const [icons, setIcons] = useState(true);
  const [alignStart, setAlignStart] = useState(false);
  const [modal, setModal] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingReason, setLoadingReason] = useState(false);
  const [disableWhileLoading, setDisableWhileLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const edit = (
    <>
      <Dropdown.Item
        leftIcon={icons ? <Pencil /> : undefined}
        rightAddOn={<kbd>⌘R</kbd>}
      >
        Rename
      </Dropdown.Item>
      <Dropdown.Item leftIcon={icons ? <Copy /> : undefined}>
        Duplicate
      </Dropdown.Item>
    </>
  );

  const featureMenu = (
    <>
      {search && (
        <Dropdown.Search
          aria-label="Search actions"
          placeholder="Search actions"
          value={searchText}
          onChange={setSearchText}
        />
      )}
      {groups ? <Dropdown.Group label="Edit">{edit}</Dropdown.Group> : edit}
      {subMenu && shareMenu}
      <Dropdown.Separator />
      <Dropdown.Item leftIcon={icons ? <Trash2 /> : undefined}>
        Delete
      </Dropdown.Item>
    </>
  );

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        Open a menu with a click, or with Enter, Space or ArrowDown on its
        trigger; arrows, Home, End and typing move through it.
      </p>

      <StorySection title="Menus">
        <Row label="Items, groups, a separator and a submenu">
          <Dropdown
            menu={
              <>
                <Dropdown.Group label="Edit">{edit}</Dropdown.Group>
                {shareMenu}
                <Dropdown.Separator />
                <Dropdown.Item leftIcon={<Trash2 />}>Delete</Dropdown.Item>
              </>
            }
          >
            <Dropdown.Button>Actions</Dropdown.Button>
          </Dropdown>
          <Dropdown
            menu={
              <>
                <Dropdown.Item selected>Newest first</Dropdown.Item>
                <Dropdown.Item>Oldest first</Dropdown.Item>
              </>
            }
          >
            <Dropdown.Button>Sort</Dropdown.Button>
          </Dropdown>
          <Dropdown menu={null}>
            <Dropdown.Button>Empty</Dropdown.Button>
          </Dropdown>
        </Row>
        <Row label="Dropdown.Search: typing filters; ArrowDown or Tab moves to the items, ArrowUp on the first item comes back">
          <PeopleMenu />
        </Row>
        <Row label="Disabled and loading with a reason: the dropdown, and submenus">
          <Dropdown
            disabledWithReason="Select a file first"
            menu={<Dropdown.Item>Rename</Dropdown.Item>}
          >
            <Dropdown.Button>Actions</Dropdown.Button>
          </Dropdown>
          <Dropdown
            menu={
              <>
                <Dropdown.Item>Rename</Dropdown.Item>
                <Dropdown.SubMenu
                  disabledWithReason="You need permission to share"
                  menu={<Dropdown.Item>Copy link</Dropdown.Item>}
                >
                  <Dropdown.Item>Share</Dropdown.Item>
                </Dropdown.SubMenu>
                <Dropdown.SubMenu
                  loadingWithReason="Loading your drives"
                  menu={<Dropdown.Item>Drive</Dropdown.Item>}
                >
                  <Dropdown.Item>Move to</Dropdown.Item>
                </Dropdown.SubMenu>
              </>
            }
          >
            <Dropdown.Button>File</Dropdown.Button>
          </Dropdown>
          <Dropdown
            loadingWithReason="Loading your files"
            menu={<Dropdown.Item>Rename</Dropdown.Item>}
          >
            <Dropdown.Button>Files</Dropdown.Button>
          </Dropdown>
        </Row>
        <Row label="Loading: the dropdown, and items; the spinner takes the left icon's place, else the right icon's">
          <Dropdown
            loadingWithReason="Loading your files"
            menu={<Dropdown.Item>Rename</Dropdown.Item>}
          >
            <Dropdown.Button>Files</Dropdown.Button>
          </Dropdown>
          <Dropdown
            menu={
              <>
                <Dropdown.Item loading>Syncing</Dropdown.Item>
                <Dropdown.Item leftIcon={<Pencil />} loading>
                  Renaming
                </Dropdown.Item>
                <Dropdown.Item rightIcon={<ArrowRight />} loading>
                  Moving
                </Dropdown.Item>
                <Dropdown.Item loadingWithReason="Loading your drives">
                  Move to drive
                </Dropdown.Item>
                <Dropdown.Item disabled>Unavailable</Dropdown.Item>
                <Dropdown.Item>Archive</Dropdown.Item>
              </>
            }
          >
            <Dropdown.Button>Items</Dropdown.Button>
          </Dropdown>
        </Row>
      </StorySection>

      <StorySection title="Dropdown.Button">
        <Row label="A base button with a muted chevron, as a trigger: sm and md">
          <Dropdown.Button>Actions</Dropdown.Button>
          <Dropdown.Button size="md">Actions</Dropdown.Button>
          <Dropdown.Button look="ghost" rightIcon={<ArrowRight />}>
            Other variant and icon
          </Dropdown.Button>
        </Row>
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={search} onCheckedChange={setSearch}>
            Search
          </Checkbox>
          <Checkbox checked={groups} onCheckedChange={setGroups}>
            Groups
          </Checkbox>
          <Checkbox checked={subMenu} onCheckedChange={setSubMenu}>
            Submenu
          </Checkbox>
          <Checkbox checked={icons} onCheckedChange={setIcons}>
            Icons
          </Checkbox>
          <Checkbox checked={alignStart} onCheckedChange={setAlignStart}>
            align start
          </Checkbox>
          <Checkbox checked={modal} onCheckedChange={setModal}>
            modal
          </Checkbox>
          <Checkbox checked={disabled} onCheckedChange={setDisabled}>
            Disabled
          </Checkbox>
          <Checkbox checked={reason} onCheckedChange={setReason}>
            Disabled reason
          </Checkbox>
          <Checkbox checked={loading} onCheckedChange={setLoading}>
            Loading
          </Checkbox>
          <Checkbox checked={loadingReason} onCheckedChange={setLoadingReason}>
            Loading reason
          </Checkbox>
          <Checkbox
            checked={disableWhileLoading}
            onCheckedChange={setDisableWhileLoading}
          >
            disableWhileLoading
          </Checkbox>
        </div>
        <Row label="The menu with the features above">
          <Dropdown
            align={alignStart ? 'start' : 'end'}
            modal={modal}
            disableWhileLoading={disableWhileLoading}
            // A reason replaces plain `disabled`: they can't be set together.
            {...(reason
              ? { disabledWithReason: 'Select a file first' }
              : { disabled })}
            {...(loadingReason
              ? { loadingWithReason: 'Loading your files' }
              : { loading })}
            menu={featureMenu}
          >
            <Dropdown.Button>Actions</Dropdown.Button>
          </Dropdown>
        </Row>
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <DropdownStories /> };
