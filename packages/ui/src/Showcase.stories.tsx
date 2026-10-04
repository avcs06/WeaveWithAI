import { Check, ChevronDown, Info, Plus, Search, Settings } from 'lucide-react';
import React, { type ReactNode, useId, useState } from 'react';

import { Avatar } from './Avatar';
import { avatarRecipe } from './Avatar/Avatar.recipes.css';
import { Button, DropdownButton, IconButton } from './Button';
import { buttonRecipe } from './Button/Button.recipes.css';
import { Card } from './Card';
import { cardRecipe } from './Card/Card.recipes.css';
import { Checkbox } from './Checkbox';
import { checkboxRecipe } from './Checkbox/Checkbox.recipes.css';
import { Chip } from './Chip';
import { chipRecipe } from './Chip/Chip.recipes.css';
import { Dialog } from './Dialog';
import { Dropdown } from './Dropdown';
import {
  formFieldStatuses,
  inputSizes,
  inputVariants,
} from './FormField/FormField.recipes.css';
import { LoadingIcon } from './Icons';
import { Input, NumberInput, PasswordInput, SearchInput } from './Input';
import { Link } from './Link';
import { linkRecipe } from './Link/Link.recipes.css';
import { Popover } from './Popover';
import { Radio, RadioGroup } from './Radio';
import { radioRecipe } from './Radio/Radio.recipes.css';
import { ScrollArea } from './ScrollArea';
import { Select } from './Select';
import { Switch } from './Switch';
import { switchRecipe } from './Switch/Switch.recipes.css';
import { Table } from './Table';
import { Tab, Tabs } from './Tabs';
import { tabsRecipe } from './Tabs/Tabs.recipes.css';
import { Tag } from './Tag';
import { tagRecipe } from './Tag/Tag.recipes.css';
import { Textarea } from './Textarea';
import { toast } from './Toast';
import { toastIconRecipe } from './Toast/Toast.recipes.css';
import { Tooltip } from './Tooltip';
import { Truncate } from './Truncate';

import type { IconButtonProps } from './Button';
import type {
  TableColumnFilter,
  TableFilterValue,
  TableSortValue,
} from './Table';
import type { SelectEntry } from './Select/Select.types';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * A playground per component: radio buttons for every variant dimension read
 * from the recipes (so new variants appear automatically), switches for
 * states, and a live preview. The table playground toggles every feature.
 */
const meta = {
  title: 'Showcase',
  parameters: { layout: 'padded', controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// Options, read from the recipes

const keysOf = <T extends object>(object: T) =>
  Object.keys(object) as Array<Extract<keyof T, string>>;

const buttonVariants = keysOf(buttonRecipe.classNames.variants.variant);
const buttonRadii = keysOf(buttonRecipe.classNames.variants.radius);
const allButtonSizes = keysOf(buttonRecipe.classNames.variants.size);
const textButtonSizes = allButtonSizes.filter(
  (size) => !size.startsWith('icon-'),
);
const iconButtonSizes = allButtonSizes
  .filter((size) => size.startsWith('icon-'))
  .map(
    (size) => size.replace('icon-', '') as NonNullable<IconButtonProps['size']>,
  );
const checkboxVariants = keysOf(checkboxRecipe.classNames.variants.variant);
const checkboxSizes = keysOf(checkboxRecipe.classNames.variants.size);
const radioVariants = keysOf(radioRecipe.classNames.variants.variant);
const radioSizes = keysOf(radioRecipe.classNames.variants.size);
const switchVariants = keysOf(switchRecipe.classNames.variants.variant);
const switchSizes = keysOf(switchRecipe.classNames.variants.size);
const tabsVariants = keysOf(tabsRecipe.classNames.variants.variant);
const linkVariants = keysOf(linkRecipe.classNames.variants.variant);
const chipVariants = keysOf(chipRecipe.classNames.variants.variant);
const chipSelections = keysOf(chipRecipe.classNames.variants.selection);
const chipSizes = keysOf(chipRecipe.classNames.variants.size);
const chipRadii = keysOf(chipRecipe.classNames.variants.radius);
const tagVariants = keysOf(tagRecipe.classNames.variants.variant);
const tagSizes = keysOf(tagRecipe.classNames.variants.size);
const avatarSizes = keysOf(avatarRecipe.classNames.variants.size);
const cardVariants = keysOf(cardRecipe.classNames.variants.variant);
const cardSelections = keysOf(cardRecipe.classNames.variants.selection);
const toastStatuses = keysOf(toastIconRecipe.classNames.variants.status);

// ---------------------------------------------------------------------------
// Playground frame

type Choices = Record<string, readonly string[]>;
type Flags = Record<string, boolean>;

/**
 * One component: a radio group per entry of `choices` (the first value is the
 * default), a switch per entry of `flags` (its value is the default), and the
 * preview `render` draws from the current values.
 */
const Playground = <C extends Choices, F extends Flags>({
  title,
  choices,
  flags,
  hint,
  render,
}: {
  title: string;
  choices: C;
  flags: F;
  hint?: string;
  render: (
    choice: { [K in keyof C]: C[K][number] },
    flag: { [K in keyof F]: boolean },
  ) => ReactNode;
}) => {
  const id = useId();
  const [choice, setChoice] = useState(
    () =>
      Object.fromEntries(
        Object.entries(choices).map(([key, values]) => [key, values[0]]),
      ) as {
        [K in keyof C]: C[K][number];
      },
  );
  const [flag, setFlag] = useState(
    () => ({ ...flags }) as { [K in keyof F]: boolean },
  );

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 320px) 1fr',
        gap: 24,
        padding: 16,
        border: '1px solid #d4d4d8',
        borderRadius: 10,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ margin: 0, fontFamily: 'system-ui', fontSize: 15 }}>
          {title}
        </h3>
        {Object.entries(choices).map(([key, values]) => (
          <RadioGroup
            key={key}
            name={`${id}-${key}`}
            label={key}
            value={choice[key]}
            onChange={(value) =>
              setChoice((current) => ({ ...current, [key]: value }))
            }
            className="flex-row-gap-3 flex-wrap"
          >
            {values.map((value) => (
              <Radio key={value} value={value} label={value} />
            ))}
          </RadioGroup>
        ))}
        {Object.keys(flags).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
            {Object.keys(flags).map((key) => (
              <Switch
                key={key}
                name={`${id}-${key}`}
                label={key}
                checked={flag[key]}
                onCheckedChange={(checked) =>
                  setFlag((current) => ({
                    ...current,
                    [key]: checked === true,
                  }))
                }
              />
            ))}
          </div>
        )}
        {hint && (
          <p
            style={{
              margin: 0,
              fontFamily: 'system-ui',
              fontSize: 12,
              opacity: 0.7,
            }}
          >
            {hint}
          </p>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 120,
          padding: 16,
          border: '1px dashed #d4d4d8',
          borderRadius: 8,
          minWidth: 0,
        }}
      >
        {render(choice, flag)}
      </div>
    </section>
  );
};

/** Placeholder portrait as an inline SVG, so nothing loads from the network. */
const photo = (hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(${hue} 55% 55%)"/><circle cx="32" cy="25" r="12" fill="white" fill-opacity="0.85"/><rect x="10" y="42" width="44" height="32" rx="16" fill="white" fill-opacity="0.85"/></svg>`,
  )}`;

const fruitOptions: SelectEntry[] = [
  { key: 'apple', type: 'option', label: 'Apple', value: 'apple' },
  { key: 'banana', type: 'option', label: 'Banana', value: 'banana' },
  {
    key: 'citrus',
    type: 'group',
    label: 'Citrus',
    options: [
      { key: 'orange', type: 'option', label: 'Orange', value: 'orange' },
      { key: 'lemon', type: 'option', label: 'Lemon', value: 'lemon' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component playgrounds

const ButtonPlayground = () => (
  <Playground
    title="Button"
    choices={{
      variant: buttonVariants,
      size: textButtonSizes,
      radius: buttonRadii,
    }}
    flags={{
      leftIcon: false,
      rightIcon: false,
      disabled: false,
      disabledReason: false,
      loading: false,
      disableWhileLoading: true,
    }}
    render={(c, f) => (
      <Button
        variant={c.variant}
        size={c.size}
        radius={c.radius}
        leftIcon={f.leftIcon ? <Plus /> : undefined}
        rightIcon={f.rightIcon ? <ChevronDown /> : undefined}
        disabled={f.disabled}
        disabledReason={
          f.disabledReason ? 'Only owners can do this' : undefined
        }
        loading={f.loading}
        disableWhileLoading={f.disableWhileLoading}
      >
        Button
      </Button>
    )}
  />
);

const IconButtonPlayground = () => (
  <Playground
    title="IconButton"
    choices={{
      variant: buttonVariants,
      size: iconButtonSizes,
      radius: buttonRadii,
    }}
    flags={{ tooltip: true, disabled: false }}
    render={(c, f) => (
      <IconButton
        variant={c.variant}
        size={c.size}
        radius={c.radius}
        aria-label="Settings"
        tooltip={f.tooltip ? 'Settings' : undefined}
        disabled={f.disabled}
      >
        <Settings />
      </IconButton>
    )}
  />
);

const InputPlayground = () => (
  <Playground
    title="Input"
    choices={{
      type: ['text', 'password', 'number', 'search'],
      variant: inputVariants,
      size: inputSizes,
      status: formFieldStatuses,
    }}
    flags={{
      label: true,
      helpText: false,
      leftIcon: false,
      loading: false,
      required: false,
      disabled: false,
    }}
    render={(c, f) => {
      const common = {
        name: 'pg-input',
        label: f.label ? 'Label' : undefined,
        'aria-label': f.label ? undefined : 'Input',
        variant: c.variant,
        size: c.size,
        error: c.status === 'error' ? 'Something is wrong' : undefined,
        helpText: f.helpText ? 'Helpful hint' : undefined,
        required: f.required,
        disabled: f.disabled,
        loading: f.loading,
        leftIcon: f.leftIcon ? <Search /> : undefined,
        placeholder: 'Type here',
      };
      return (
        <div style={{ width: 280 }} key={c.type}>
          {c.type === 'password' ? (
            <PasswordInput {...common} />
          ) : c.type === 'number' ? (
            <NumberInput {...common} min={0} max={100} />
          ) : c.type === 'search' ? (
            <SearchInput {...common} />
          ) : (
            <Input {...common} />
          )}
        </div>
      );
    }}
  />
);

const SelectPlayground = () => (
  <Playground
    title="Select"
    choices={{
      variant: inputVariants,
      size: inputSizes,
      status: formFieldStatuses,
    }}
    flags={{
      multiple: false,
      showCheckbox: false,
      allowSearch: false,
      leftIcon: false,
      loading: false,
      disableWhileLoading: false,
      disabled: false,
    }}
    render={(c, f) => (
      <div style={{ width: 260 }} key={String(f.multiple)}>
        <Select
          name="pg-select"
          label="Fruit"
          variant={c.variant}
          size={c.size}
          error={c.status === 'error' ? 'Pick a fruit' : undefined}
          options={fruitOptions}
          {...(f.multiple ? { multiple: true as const } : {})}
          showCheckbox={f.showCheckbox}
          allowSearch={f.allowSearch}
          leftIcon={f.leftIcon ? <Info /> : undefined}
          loading={f.loading}
          disableWhileLoading={f.disableWhileLoading}
          disabled={f.disabled}
          placeholder="Pick one"
        />
      </div>
    )}
  />
);

const TextareaPlayground = () => (
  <Playground
    title="Textarea"
    choices={{
      variant: inputVariants,
      size: inputSizes,
      status: formFieldStatuses,
    }}
    flags={{ helpText: false, disabled: false }}
    render={(c, f) => (
      <div style={{ width: 300 }}>
        <Textarea
          name="pg-textarea"
          label="Notes"
          variant={c.variant}
          size={c.size}
          error={c.status === 'error' ? 'Required' : undefined}
          helpText={f.helpText ? 'Markdown works' : undefined}
          disabled={f.disabled}
          rows={3}
          placeholder="A few words"
        />
      </div>
    )}
  />
);

const CheckboxPlayground = () => (
  <Playground
    title="Checkbox"
    choices={{
      variant: checkboxVariants,
      size: checkboxSizes,
      state: ['unchecked', 'checked', 'indeterminate'],
    }}
    flags={{ label: true, disabled: false }}
    render={(c, f) => (
      <Checkbox
        key={c.state}
        name="pg-checkbox"
        variant={c.variant}
        size={c.size}
        label={f.label ? 'Remember me' : undefined}
        aria-label={f.label ? undefined : 'Remember me'}
        defaultChecked={
          c.state === 'indeterminate' ? 'indeterminate' : c.state === 'checked'
        }
        disabled={f.disabled}
      />
    )}
  />
);

const RadioPlayground = () => (
  <Playground
    title="Radio"
    choices={{ variant: radioVariants, size: radioSizes }}
    flags={{ disabledOption: false, groupDisabled: false }}
    render={(c, f) => (
      <RadioGroup
        name="pg-radio"
        label="Plan"
        defaultValue="pro"
        disabled={f.groupDisabled}
      >
        <Radio value="free" variant={c.variant} size={c.size} label="Free" />
        <Radio value="pro" variant={c.variant} size={c.size} label="Pro" />
        <Radio
          value="team"
          variant={c.variant}
          size={c.size}
          label="Team"
          disabled={f.disabledOption}
        />
      </RadioGroup>
    )}
  />
);

const SwitchPlayground = () => (
  <Playground
    title="Switch"
    choices={{ variant: switchVariants, size: switchSizes }}
    flags={{ label: true, defaultChecked: false, disabled: false }}
    render={(c, f) => (
      <Switch
        key={String(f.defaultChecked)}
        name="pg-switch"
        variant={c.variant}
        size={c.size}
        label={f.label ? 'Notifications' : undefined}
        aria-label={f.label ? undefined : 'Notifications'}
        defaultChecked={f.defaultChecked}
        disabled={f.disabled}
      />
    )}
  />
);

const ChipPlayground = () => (
  <Playground
    title="Chip"
    choices={{
      variant: chipVariants,
      selection: chipSelections,
      size: chipSizes,
      radius: chipRadii,
    }}
    flags={{ defaultActive: false, leftIcon: false, disabled: false }}
    hint="variant picks the colors: default the theme set, base the base set. Click to toggle: selection outline adds a 2px border, filled fills with the accent. In a ChipGroup the mode decides the selection: single outlines, multiple fills."
    render={(c, f) => (
      <Chip
        key={String(f.defaultActive)}
        variant={c.variant}
        selection={c.selection}
        size={c.size}
        radius={c.radius}
        defaultActive={f.defaultActive}
        disabled={f.disabled}
        leftIcon={f.leftIcon ? <Check size={16} /> : undefined}
      >
        Engineering
      </Chip>
    )}
  />
);

const TagPlayground = () => (
  <Playground
    title="Tag"
    choices={{ variant: tagVariants, size: tagSizes }}
    flags={{
      bordered: true,
      icon: false,
      closable: false,
      tooltip: false,
      disabled: false,
    }}
    render={(c, f) => (
      <Tag
        variant={c.variant}
        size={c.size}
        bordered={f.bordered}
        icon={f.icon ? <Info size={12} /> : undefined}
        closable={f.closable}
        onClose={() => toast({ title: 'Tag closed' })}
        tooltip={f.tooltip ? 'More about this tag' : undefined}
        disabled={f.disabled}
      >
        Engineering
      </Tag>
    )}
  />
);

const AvatarPlayground = () => (
  <Playground
    title="Avatar"
    choices={{ size: avatarSizes, content: ['initials', 'image', 'no name'] }}
    flags={{}}
    render={(c) => (
      <Avatar
        size={c.size}
        name={c.content === 'no name' ? undefined : 'Ada Lovelace'}
        src={c.content === 'image' ? photo(210) : undefined}
      />
    )}
  />
);

const CardPlayground = () => (
  <Playground
    title="Card"
    choices={{ variant: cardVariants, selection: cardSelections }}
    flags={{
      elevated: false,
      clickable: false,
      toggles: false,
      disabled: false,
    }}
    hint="With toggles on, the card is a checkbox: click it to see the selection's active look."
    render={(c, f) => (
      <div style={{ width: 260 }}>
        <Card
          key={String(f.toggles)}
          variant={c.variant}
          selection={c.selection}
          elevated={f.elevated}
          defaultActive={f.toggles ? false : undefined}
          disabled={f.disabled}
          clickable={f.clickable}
          onClick={
            f.clickable ? () => toast({ title: 'Card clicked' }) : undefined
          }
        >
          <strong>Card title</strong>
          <span>Supporting text for the card.</span>
        </Card>
      </div>
    )}
  />
);

const ToastPlayground = () => (
  <Playground
    title="Toast"
    choices={{ status: toastStatuses }}
    flags={{ closable: true, action: false }}
    render={(c, f) => (
      <Button
        variant="base"
        onClick={() =>
          toast({
            title: `A ${c.status} toast`,
            status: c.status,
            closable: f.closable,
            action: f.action
              ? { altText: 'Undo', children: 'Undo' }
              : undefined,
          })
        }
      >
        Show toast
      </Button>
    )}
  />
);

const OverlaysPlayground = () => (
  <Playground
    title="Dropdown / Popover / Dialog / Tooltip"
    choices={{ open: ['dropdown', 'popover', 'dialog', 'tooltip'] }}
    flags={{ dropdownSearch: true, dialogClosable: true }}
    render={(c, f) => {
      if (c.open === 'dropdown')
        return (
          <Dropdown
            allowSearch={f.dropdownSearch}
            searchPlaceholder="Search actions"
            items={[
              {
                key: 'rename',
                type: 'option',
                label: 'Rename',
                onSelect: () => toast({ title: 'Rename' }),
              },
              {
                key: 'dup',
                type: 'option',
                label: 'Duplicate',
                rightSlot: '⌘D',
              },
              { key: 'sep', type: 'separator' },
              {
                key: 'share',
                type: 'group',
                label: 'Share',
                options: [{ key: 'copy', type: 'option', label: 'Copy link' }],
              },
              {
                key: 'delete',
                type: 'option',
                label: 'Delete',
                disabled: true,
              },
            ]}
          >
            <DropdownButton variant="base">Actions</DropdownButton>
          </Dropdown>
        );
      if (c.open === 'popover')
        return (
          <Popover
            aria-label="Filter options"
            menu={<Input name="pg-pop" label="Contains" />}
          >
            <Button variant="base">Open popover</Button>
          </Popover>
        );
      if (c.open === 'dialog')
        return (
          <Dialog
            trigger={<Button>Open dialog</Button>}
            title="Publish project"
            content="Your team will see the latest version."
            closable={f.dialogClosable}
            footer={(withClose) => (
              <>
                {withClose(<Button variant="ghost">Cancel</Button>)}
                {withClose(
                  <Button
                    onClick={() =>
                      toast({ title: 'Published', status: 'success' })
                    }
                  >
                    Publish
                  </Button>,
                )}
              </>
            )}
          />
        );
      return (
        <Tooltip tooltip="Saves a draft">
          <Button variant="base">Hover or focus me</Button>
        </Tooltip>
      );
    }}
  />
);

const TabsPlayground = () => (
  <Playground
    title="Tabs"
    choices={{ variant: tabsVariants }}
    flags={{ icons: false, disabledTab: true }}
    render={(c, f) => (
      <div style={{ width: 360 }}>
        <Tabs variant={c.variant} defaultValue="general">
          <Tab
            value="general"
            title="General"
            leftIcon={f.icons ? <Settings /> : undefined}
          >
            General settings
          </Tab>
          <Tab
            value="billing"
            title="Billing"
            leftIcon={f.icons ? <Info /> : undefined}
          >
            Billing settings
          </Tab>
          <Tab value="team" title="Team" disabled={f.disabledTab}>
            Team settings
          </Tab>
        </Tabs>
      </div>
    )}
  />
);

const MiscPlayground = () => (
  <Playground
    title="Truncate / ScrollArea / Link / Icons"
    choices={{
      show: ['truncate', 'scroll area', 'link', 'icons'],
      width: ['120', '240', '400'],
      linkVariant: linkVariants,
    }}
    flags={{ alwaysShowTooltip: false, linkDisabled: false }}
    hint="`width` applies to Truncate and ScrollArea; `linkVariant` to Link (tab to it to see the focus ring)."
    render={(c, f) => {
      const width = Number(c.width);
      if (c.show === 'truncate')
        return (
          <div style={{ width }}>
            <Truncate alwaysShowTooltip={f.alwaysShowTooltip}>
              A long label that only fits when there is room for it
            </Truncate>
          </div>
        );
      if (c.show === 'scroll area')
        return (
          <div
            style={{
              width,
              height: 140,
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #d4d4d8',
            }}
          >
            <ScrollArea>
              {Array.from({ length: 20 }, (_, index) => (
                <div
                  key={index}
                  style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}
                >
                  Item {index + 1} with a fairly long description
                </div>
              ))}
            </ScrollArea>
          </div>
        );
      if (c.show === 'link')
        return (
          <Link
            href="#showcase"
            variant={c.linkVariant}
            disabled={f.linkDisabled}
          >
            Documentation
          </Link>
        );
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <LoadingIcon size={24} role="img" aria-label="Loading" />
        </div>
      );
    }}
  />
);

// ---------------------------------------------------------------------------
// Table playground

type Team = 'Engineering' | 'Design' | 'Sales' | 'Support';
type Status = 'active' | 'on-leave' | 'inactive';
type Person = {
  id: number;
  name: string;
  email: string;
  team: Team;
  salary: number;
  startedAt: Date;
  status: Status;
  location: string;
  phone: string;
  manager: string;
  level: number;
};

const FIRST = [
  'Ada',
  'Grace',
  'Linus',
  'Edsger',
  'Barbara',
  'Alan',
  'Margaret',
  'Donald',
];
const LAST = [
  'Lovelace',
  'Hopper',
  'Torvalds',
  'Dijkstra',
  'Liskov',
  'Turing',
  'Hamilton',
  'Knuth',
];
const TEAMS: Team[] = ['Engineering', 'Design', 'Sales', 'Support'];
const STATUSES: Status[] = [
  'active',
  'active',
  'active',
  'on-leave',
  'inactive',
];
const NOW = new Date('2026-10-01').getTime();
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

const CITIES = ['Lisbon', 'Toronto', 'Berlin', 'Singapore', 'Austin', 'Sydney'];

const makePeople = (count: number): Person[] =>
  Array.from({ length: count }, (_, index) => {
    const name = `${FIRST[index % FIRST.length]} ${LAST[(index * 3) % LAST.length]} ${index + 1}`;
    return {
      id: index + 1,
      name,
      email: `${name.toLowerCase().replace(/ /g, '.')}@example.com`,
      team: TEAMS[index % TEAMS.length],
      salary: 40000 + ((index * 7919) % 120000),
      startedAt: new Date(NOW - ((index * 37) % 15) * YEAR_MS),
      status: STATUSES[index % STATUSES.length],
      location: CITIES[index % CITIES.length],
      phone: `+1 555 ${String(1000 + ((index * 7) % 9000)).padStart(4, '0')}`,
      manager: `${FIRST[(index + 3) % FIRST.length]} ${LAST[(index + 5) % LAST.length]}`,
      level: 1 + (index % 6),
    };
  });

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const asOptions = (values: readonly string[]) =>
  values.map((value) => ({ label: value, value }));
// Stable, so a column's props don't change on every render.
const NO_FILTERS: TableFilterValue = {};
const TEXT_FILTER: TableColumnFilter = { type: 'text' };
const NUMBER_FILTER: TableColumnFilter = { type: 'number' };
const TEAM_FILTER: TableColumnFilter = {
  type: 'enum',
  options: asOptions(TEAMS),
};
const STATUS_FILTER: TableColumnFilter = {
  type: 'enum',
  options: asOptions(['active', 'on-leave', 'inactive']),
};

const STATUS_TAG = {
  active: 'success',
  'on-leave': 'warning',
  inactive: 'base',
} as const;

const TableDemo = ({
  rows,
  columnCount,
  flags: f,
  paginationSize,
  paginationContent,
}: {
  rows: number;
  /** 4, 8 or 12. Every column has a fixed width, so more columns scroll sideways. */
  columnCount: number;
  flags: Record<
    | 'sort'
    | 'filter'
    | 'selection'
    | 'expansion'
    | 'reorder'
    | 'pagination'
    | 'virtualized'
    | 'loading'
    | 'empty'
    | 'rowClick',
    boolean
  >;
  paginationSize: 'full' | 'minimal';
  paginationContent: 'text' | 'icons';
}) => {
  const [data, setData] = useState(() => makePeople(rows));
  const [sort, setSort] = useState<TableSortValue>(null);
  const [filters, setFilters] = useState<TableFilterValue>(NO_FILTERS);
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        // Virtualization needs a fixed height; otherwise the table grows to a cap.
        height: f.virtualized ? 480 : undefined,
        maxHeight: f.virtualized ? undefined : 560,
      }}
    >
      <Table
        caption="People"
        data={f.empty ? [] : data}
        rowKey={(row) => row.id}
        virtualized={f.virtualized}
        loading={f.loading}
        onRowClick={
          f.rowClick
            ? (row) => toast({ title: `Clicked ${row.name}` })
            : undefined
        }
      >
        {/* Columns decide what can sort or filter; the switches toggle their
            props. Off also passes no sort / no filters, so nothing stays
            applied out of sight; on again restores the last ones. */}
        <Table.Sort value={f.sort ? sort : null} onChange={setSort} />
        <Table.Filter
          value={f.filter ? filters : NO_FILTERS}
          onChange={setFilters}
        />
        {f.selection && (
          <Table.Selection
            defaultValue={[1, 2]}
            isRowSelectable={(row: Person) => row.status !== 'inactive'}
            isRowDisabled={(row: Person) => row.status === 'on-leave'}
          />
        )}
        {f.expansion && (
          <Table.Expansion
            isRowDisabled={(row: Person) => row.status === 'on-leave'}
          >
            {(row: Person) => (
              <div style={{ padding: '8px 0' }}>
                {row.name} joined {row.team} on{' '}
                {row.startedAt.toLocaleDateString('en-US')}.
              </div>
            )}
          </Table.Expansion>
        )}
        {f.reorder && (
          <Table.Reorder
            onReorder={({ rows: reordered }: { rows: Person[] }) =>
              setData(reordered)
            }
            isRowDisabled={(row: Person) => row.status === 'on-leave'}
          />
        )}
        <Table.Column<Person>
          id="name"
          title="Name"
          dataKey="name"
          // With 4 columns Name takes the remaining width, so it fits.
          width={columnCount >= 8 ? 220 : undefined}
          sortable={f.sort}
          filter={f.filter ? TEXT_FILTER : undefined}
        />
        {columnCount >= 8 && (
          <Table.Column<Person>
            id="email"
            title="Email"
            dataKey="email"
            filter={f.filter ? TEXT_FILTER : undefined}
          />
        )}
        <Table.Column<Person>
          id="team"
          title="Team"
          dataKey="team"
          width={130}
          sortable={f.sort}
          filter={f.filter ? TEAM_FILTER : undefined}
        />
        {columnCount >= 8 && (
          <Table.Column<Person>
            id="location"
            title="Location"
            dataKey="location"
            sortable={f.sort}
            filter={f.filter ? TEXT_FILTER : undefined}
          />
        )}
        <Table.Column<Person>
          id="salary"
          title="Salary"
          dataKey="salary"
          width={120}
          align="right"
          sortable={f.sort}
          filter={f.filter ? NUMBER_FILTER : undefined}
        >
          {(salary) => currency.format(salary)}
        </Table.Column>
        {columnCount >= 8 && (
          <Table.Column<Person, number>
            id="tenure"
            title="Tenure (years)"
            dataKey="startedAt"
            computed={(startedAt) =>
              Math.floor((NOW - startedAt.getTime()) / YEAR_MS)
            }
            width={140}
            align="right"
            sortable={f.sort}
          />
        )}
        {columnCount >= 8 && (
          <Table.Column<Person>
            id="started"
            title="Started"
            dataKey="startedAt"
            sortable={f.sort}
          >
            {(startedAt) => startedAt.toLocaleDateString('en-US')}
          </Table.Column>
        )}
        <Table.Column<Person>
          id="status"
          title="Status"
          dataKey="status"
          width={110}
          filter={f.filter ? STATUS_FILTER : undefined}
        >
          {(status) => (
            <Tag size="xs" variant={STATUS_TAG[status]}>
              {status}
            </Tag>
          )}
        </Table.Column>
        {columnCount >= 12 && (
          <Table.Column<Person> id="phone" title="Phone" dataKey="phone" />
        )}
        {columnCount >= 12 && (
          <Table.Column<Person>
            id="manager"
            title="Manager"
            dataKey="manager"
            width={200}
            sortable={f.sort}
            filter={f.filter ? TEXT_FILTER : undefined}
          />
        )}
        {columnCount >= 12 && (
          <Table.Column<Person>
            id="level"
            title="Level"
            dataKey="level"
            width={100}
            align="right"
            sortable={f.sort}
            filter={f.filter ? NUMBER_FILTER : undefined}
          />
        )}
        {columnCount >= 12 && (
          <Table.Column<Person>
            id="id"
            title="ID"
            dataKey="id"
            width={90}
            align="right"
            sortable={f.sort}
          />
        )}
        {f.pagination && (
          <Table.Pagination
            size={paginationSize}
            content={paginationContent}
            pageSizeOptions={[10, 25, 50]}
          />
        )}
      </Table>
    </div>
  );
};

const TablePlaygroundSection = () => (
  <Playground
    title="Table"
    choices={{
      rows: ['120', '25', '5000'],
      columns: ['4', '8', '12'],
      paginationSize: ['full', 'minimal'] as const,
      paginationContent: ['text', 'icons'] as const,
    }}
    flags={{
      sort: true,
      filter: true,
      selection: true,
      expansion: true,
      reorder: true,
      pagination: true,
      virtualized: false,
      loading: false,
      empty: false,
      rowClick: false,
    }}
    hint="With 8 or 12 columns, Email, Location, Started and Phone have no width: they share what's left and stop at their minimum (two letters of the title plus its sort and filter icons), then the table scrolls sideways. With 4, Name takes the remaining width.Sorting turns reordering off; with expansion on, a row click expands the row instead of calling onRowClick. Inactive rows can't be selected; on-leave rows are disabled."
    render={(c, f) => (
      // A new row count starts from fresh data.
      <TableDemo
        key={c.rows}
        rows={Number(c.rows)}
        columnCount={Number(c.columns)}
        flags={f}
        paginationSize={c.paginationSize}
        paginationContent={c.paginationContent}
      />
    )}
  />
);

// ---------------------------------------------------------------------------
// Stories

/** Every component as a playground, then the table. */
export const Playground_: Story = {
  name: 'Playground',
  render: () => (
    <div
      id="showcase"
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      <ButtonPlayground />
      <IconButtonPlayground />
      <InputPlayground />
      <SelectPlayground />
      <TextareaPlayground />
      <CheckboxPlayground />
      <RadioPlayground />
      <SwitchPlayground />
      <ChipPlayground />
      <TagPlayground />
      <AvatarPlayground />
      <CardPlayground />
      <ToastPlayground />
      <OverlaysPlayground />
      <TabsPlayground />
      <MiscPlayground />
      <TablePlaygroundSection />
    </div>
  ),
};

/** The table playground on its own. */
export const TablePlayground: Story = {
  name: 'Table playground',
  render: () => <TablePlaygroundSection />,
};
