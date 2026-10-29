import { Plus } from 'lucide-react';
import React, { type ReactNode } from 'react';

import { Accordion, Collapsible } from './Accordion';
import { Avatar } from './Avatar';
import { Button, IconButton } from './Button';
import { Card } from './Card';
import { Checkbox } from './Checkbox';
import { Chip } from './Chip';
import { Dialog } from './Dialog';
import { Dropdown } from './Dropdown';
import { Input, NumberInput, PasswordInput, SearchInput } from './Input';
import { Pagination } from './Pagination';
import { Popover, PopoverButton } from './Popover';
import { Radio, RadioGroup } from './Radio';
import { Section } from './Section';
import { MultiSelect, Select, SelectOption } from './Select';
import { Switch } from './Switch';
import { createTable } from './Table';
import { Tab, Tabs } from './Tabs';
import { Tag } from './Tag';
import { Textarea } from './Textarea';

import type { Meta, StoryObj } from '@storybook/react-vite';

// Every case twice, with short and with long content, for
// tools/measure-design-system.mjs: a dimension equal in both is fixed.
const meta = {
  title: 'Measure',
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

type Kind = 'short' | 'long';

const contents = {
  short: {
    label: 'Save',
    name: 'Ada',
    title: 'Refunds',
    text: 'One line of text.',
    para: 'A short note.',
  },
  long: {
    label: 'Save and continue later',
    name: 'Ada Lovelace Byron King',
    title: 'Refunds, cancellations and transfers',
    text: 'A longer single line of supporting text here.',
    para:
      'A long paragraph that wraps over several lines so that any container sized by its content grows with it, which marks its height as dynamic rather than fixed. '.repeat(
        3,
      ),
  },
};
type Content = (typeof contents)[Kind];

type Case = {
  name: string;
  /** `data-slot` parts to measure under the root. */
  parts?: string[];
  /** false: the root is a wrapper of no interest, only parts count. */
  root?: boolean;
  /** The root renders through a portal: found by its name in the document. */
  portal?: 'dialog' | 'menu' | 'option';
  /** Parts read again at height 0, for their minimum height. */
  min?: string[];
  /** A wrapper width for both renderings, when the component wraps when narrow. */
  width?: number;
  /** A root dimension the wrapper fixes, so not the component's. */
  skip?: 'width';
  /** The tool clicks the first button to open the portal before reading. */
  open?: boolean;
  render: (content: Content, name: string, kind: Kind) => ReactNode;
};

const options = Array.from({ length: 8 }, (_, i) => ({
  value: String(i),
  label: `Option ${i + 1} of the list`,
}));
const field = (size: 'sm' | 'md', content: Content) => ({
  size,
  label: content.label,
  helpText: content.text,
});

const RowTable = createTable<{ id: number; name: string; role: string }>();
const rows = (content: Content) =>
  Array.from({ length: 5 }, (_, i) => ({
    id: i,
    name: `${content.name} ${i}`,
    role: content.label,
  }));

const sized = <S extends string>(
  sizes: readonly S[],
  make: (size: S) => Omit<Case, 'name'>,
  component: string,
): Case[] =>
  sizes.map((size) => ({ name: `${component}/${size}`, ...make(size) }));

const cases: Case[] = [
  ...sized(
    ['sm', 'md'],
    (size) => ({ render: (c) => <Button size={size}>{c.label}</Button> }),
    'Button',
  ),
  ...sized(
    ['xs', 'sm', 'md'],
    (size) => ({
      render: (c) => (
        <IconButton size={size} tooltip={c.label}>
          <Plus />
        </IconButton>
      ),
    }),
    'IconButton',
  ),
  ...sized(
    ['sm', 'md'],
    (size) => ({
      render: (c) => (
        <Popover menu={<p>{c.text}</p>}>
          <PopoverButton size={size}>{c.label}</PopoverButton>
        </Popover>
      ),
    }),
    'PopoverButton',
  ),
  ...sized(
    ['sm', 'md', 'lg'],
    (size) => ({ render: (c) => <Avatar size={size} name={c.name} /> }),
    'Avatar',
  ),
  ...sized(
    ['xs', 'sm'],
    (size) => ({ render: (c) => <Tag size={size}>{c.label}</Tag> }),
    'Tag',
  ),
  ...sized(
    ['sm', 'md'],
    (size) => ({ render: (c) => <Chip size={size}>{c.label}</Chip> }),
    'Chip',
  ),
  ...sized(
    ['sm', 'md'],
    (size) => ({
      parts: ['box'],
      render: (c) => (
        <Checkbox size={size} name={`checkbox-${size}`}>
          {c.label}
        </Checkbox>
      ),
    }),
    'Checkbox',
  ),
  ...sized(
    ['sm', 'md'],
    (size) => ({
      root: false,
      parts: ['box'],
      render: (c) => (
        <RadioGroup
          name={`radio-${size}`}
          label="Plan"
          value="a"
          onChange={() => {}}
        >
          <Radio size={size} value="a">
            {c.label}
          </Radio>
        </RadioGroup>
      ),
    }),
    'Radio',
  ),
  ...sized(
    ['sm', 'md'],
    (size) => ({
      parts: ['track'],
      render: (c) => (
        <Switch size={size} checked onCheckedChange={() => {}}>
          {c.label}
        </Switch>
      ),
    }),
    'Switch',
  ),
  // The whole field: label, box and help text, then with an error message too.
  ...sized(
    ['sm', 'md', 'sm+error', 'md+error'],
    (key) => ({
      skip: 'width',
      parts: ['label-row', 'box', 'help', 'message'],
      render: (c) => (
        <Input
          {...field(key.startsWith('sm') ? 'sm' : 'md', c)}
          error={key.endsWith('+error') ? c.text : undefined}
          value={c.label}
          onChange={() => {}}
          autoComplete="off"
        />
      ),
    }),
    'FormControl',
  ),
  {
    name: 'Card',
    min: ['root'],
    render: (c) => (
      <Card>
        <p>{c.para}</p>
      </Card>
    ),
  },
  ...sized(
    ['sm', 'md'],
    (size) => ({
      skip: 'width',
      parts: ['box'],
      render: (c) => (
        <Input
          {...field(size, c)}
          value={c.label}
          onChange={() => {}}
          autoComplete="off"
        />
      ),
    }),
    'Input',
  ),
  ...sized(
    ['sm', 'md'],
    (size) => ({
      skip: 'width',
      parts: ['box'],
      render: (c) => (
        <NumberInput
          {...field(size, c)}
          value={c.label.length}
          onChange={() => {}}
          autoComplete="off"
        />
      ),
    }),
    'NumberInput',
  ),
  ...sized(
    ['sm', 'md'],
    (size) => ({
      skip: 'width',
      parts: ['box'],
      render: (c) => (
        <PasswordInput
          {...field(size, c)}
          value={c.label}
          onChange={() => {}}
          autoComplete="off"
        />
      ),
    }),
    'PasswordInput',
  ),
  ...sized(
    ['sm', 'md'],
    (size) => ({
      skip: 'width',
      parts: ['box'],
      render: (c) => (
        <SearchInput {...field(size, c)} value={c.label} onChange={() => {}} />
      ),
    }),
    'SearchInput',
  ),
  ...sized(
    ['sm', 'md'],
    (size) => ({
      skip: 'width',
      parts: ['box'],
      render: (c) => (
        <Select {...field(size, c)} value="0" onChange={() => {}}>
          {options.map((option) => (
            <SelectOption key={option.value} {...option} />
          ))}
        </Select>
      ),
    }),
    'Select',
  ),
  ...sized(
    ['sm', 'md'],
    (size) => ({
      skip: 'width',
      root: false,
      parts: ['box'],
      min: ['box'],
      render: (c, _name, kind) => (
        <MultiSelect
          {...field(size, c)}
          value={
            kind === 'short' ? ['0'] : options.map((option) => option.value)
          }
          onChange={() => {}}
        >
          {options.map((option) => (
            <SelectOption key={option.value} {...option} />
          ))}
        </MultiSelect>
      ),
    }),
    'MultiSelect',
  ),
  ...sized(
    ['sm', 'md'],
    (size) => ({
      skip: 'width',
      parts: ['box'],
      min: ['box'],
      render: (c) => (
        <Textarea {...field(size, c)} value={c.para} onChange={() => {}} />
      ),
    }),
    'Textarea',
  ),
  {
    name: 'SelectOption',
    portal: 'option',
    open: true,
    render: (c, name, kind) => (
      <Select {...field('sm', c)} value="b" onChange={() => {}}>
        <SelectOption value="a" label={`${name} ${kind}`} />
        <SelectOption value="b" label={c.text} />
      </Select>
    ),
  },
  // Closed, the item is the header band; the trigger's hit area covers all of it.
  {
    name: 'Accordion/header',
    skip: 'width',
    render: (c) => (
      <Accordion>
        <Accordion.Item value="a" title={c.title}>
          <p>{c.para}</p>
        </Accordion.Item>
      </Accordion>
    ),
  },
  {
    name: 'Collapsible/header',
    skip: 'width',
    render: (c) => (
      <Collapsible title={c.title}>
        <p>{c.para}</p>
      </Collapsible>
    ),
  },
  {
    name: 'Tabs',
    root: false,
    parts: ['list', 'trigger'],
    render: (c) => (
      <Tabs>
        <Tab value="a" title={c.title}>
          {c.para}
        </Tab>
        <Tab value="b" title="Second">
          {c.text}
        </Tab>
      </Tabs>
    ),
  },
  {
    name: 'Section',
    root: false,
    parts: ['header'],
    render: (c) => (
      <Section title={c.title} description={c.text}>
        <p>{c.para}</p>
      </Section>
    ),
  },
  ...sized(
    ['sm', 'md', 'lg'],
    (size) => ({
      portal: 'dialog',
      parts: ['header', 'footer'],
      render: (c, name, kind) => (
        <Dialog
          size={size}
          open
          title={`${name} ${kind}`}
          footer={() => <Button>{c.label}</Button>}
        >
          <p>{c.para}</p>
        </Dialog>
      ),
    }),
    'Dialog',
  ),
  {
    name: 'Dropdown',
    root: false,
    portal: 'menu',
    parts: ['item'],
    render: (c, name, kind) => (
      <Dropdown
        open
        modal={false}
        menu={
          <>
            <Dropdown.Item>{`${name} ${kind}`}</Dropdown.Item>
            <Dropdown.Item>{c.text}</Dropdown.Item>
          </>
        }
      >
        <Button variant="base">{c.label}</Button>
      </Dropdown>
    ),
  },
  {
    name: 'Table',
    root: false,
    skip: 'width',
    parts: ['header', 'row', 'pagination'],
    render: (c) => (
      <RowTable caption={c.title} data={rows(c)} rowKey={(row) => row.id}>
        <RowTable.Column
          id="name"
          rowHeader
          title="Name"
          dataKey="name"
          width={200}
        />
        <RowTable.Column id="role" title="Role" dataKey="role" width={160} />
        <RowTable.Pagination pageSizeOptions={[5]} />
      </RowTable>
    ),
  },
  // Wide enough for one row: the info and the controls side by side.
  ...sized(
    ['full', 'minimal'],
    (size) => ({
      width: 1100,
      skip: 'width',
      render: (c) => (
        <Pagination
          size={size}
          label={`${c.label} pages`}
          totalItems={size === 'full' ? 95 : 9500}
          itemName={c.label}
        />
      ),
    }),
    'Pagination',
  ),
];

const Column = ({
  kind,
  width,
  items,
}: {
  kind: Kind;
  width: number;
  items: Case[];
}) => (
  // A fixed track: a wrapper wider than the column overflows instead of widening it.
  <div
    style={{
      width,
      display: 'grid',
      gridTemplateColumns: `${width}px`,
      gap: 24,
      alignContent: 'start',
    }}
  >
    {items.map((item) => (
      <div
        key={item.name}
        data-measure={item.name}
        data-content={kind}
        data-parts={item.parts?.join(' ')}
        data-root={item.root === false ? '0' : '1'}
        data-portal={item.portal}
        data-min={item.min?.join(' ')}
        data-skip={item.skip}
        data-open={item.open ? '1' : undefined}
        style={{ display: 'grid', justifyItems: 'start', width: item.width }}
      >
        {item.render(contents[kind], item.name, kind)}
      </div>
    ))}
  </div>
);

// The columns differ in width, so an element that fills its container
// reads as dynamic. Open dialogs trap focus, so they get their own story.
const page = (items: Case[]) => (
  <div
    style={{ display: 'flex', gap: 48, padding: 24, alignItems: 'flex-start' }}
  >
    <Column kind="short" width={480} items={items} />
    <Column kind="long" width={720} items={items} />
  </div>
);

export const All: Story = {
  render: () => page(cases.filter((item) => item.portal !== 'dialog')),
};

export const Dialogs: Story = {
  render: () => page(cases.filter((item) => item.portal === 'dialog')),
};
