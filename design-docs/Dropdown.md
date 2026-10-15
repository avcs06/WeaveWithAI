# Dropdown — design contract

Dropdown uses [Button](Button.md) and [ScrollArea](ScrollArea.md). Shared visual rules are in [Dropdown foundations](Dropdown-foundations.md).
This document fixes the public contract; examples are supported usage.

## Public data types

```ts
type DisabledState =
  | { disabledReason: string; disabled?: never }
  | { disabled?: boolean; disabledReason?: never };

type DropdownRowContent = {
  label: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

type DropdownItemData = DropdownRowContent & DisabledState & {
  type: "item";
  key: string;
  onSelect?: (event: Event) => void;
};

type DropdownGroupData<T> = {
  type: "group";
  key: string;
  label?: string;
  items: readonly DropdownEntry<T>[];
};

type DropdownSubMenuData<T> = DropdownRowContent & DisabledState & {
  type: "submenu";
  key: string;
  items: readonly DropdownEntry<T>[];
};

type DropdownSeparatorData = {
  type: "separator";
  key: string;
};

type DropdownEntry<T> =
  | T
  | DropdownGroupData<T>
  | DropdownSubMenuData<T>
  | DropdownSeparatorData;
```

Groups/submenus contain leaf items, groups, separators and nested submenus.
Keys are unique among siblings. `group`, `submenu` and `separator` are reserved
`type` values and must not be used by arbitrary leaf objects. Item data has no
description property.

## Root props and three content modes

```ts
type DropdownSource<T> =
  | {
      items: readonly DropdownEntry<DropdownItemData>[];
      itemRenderer?: never;
      menu?: never;
    }
  | {
      items: readonly DropdownEntry<T>[];
      itemRenderer: (item: T) => React.ReactElement<
        DropdownItemProps, typeof Dropdown.Item
      >;
      menu?: never;
    }
  | {
      menu: React.ReactNode;
      items?: never;
      itemRenderer?: never;
    };

type DropdownCommonProps = DisabledState & {
  children: React.ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  "aria-label"?: string;
};

type DropdownProps<T> = DropdownCommonProps & DropdownSource<T>;
```

Export these types through `@packages/ui/Dropdown`. Equivalent internal type
factoring is allowed; preserve public names, exclusivity and leaf-type inference.
`children` is always one trigger element forwarding refs/events/attributes.
`aria-label` labels root menu content; otherwise derive its name from the trigger.

### Contract mode

Render leaf rows from DropdownItemData with opinionated icon/label/slot UI.
Traverse structural nodes recursively. An empty items array is valid.

### Items plus renderer mode

Leaf items have the user's shape; structural nodes follow this document's fixed
contracts. Traverse groups/submenus and invoke itemRenderer **only for leaves**.
Every invocation returns Dropdown.Item, including nested leaves. Preserve
supplied order and use structural keys; preserve renderer-provided React keys for
leaves and document that dynamic/reordered lists should give their Item a key.
Do not guess id/key fields in arbitrary leaf objects.

TypeScript cannot reliably enforce JSX element identity. In development validate
that each renderer result is a valid element with type exactly Dropdown.Item.
Reject null, arrays, fragments and other elements with a useful error identifying
the leaf's path. Validate incompatible source props, malformed structural nodes,
missing contract keys/labels, duplicate sibling keys and disabled conflicts too.

### Individually rendered menu mode

Render menu as authored. Support fragments and wrapper components; do not inspect
only direct children or flatten away context. Explicit separators control spacing
in this mode. Compound parts are real Radix-backed components, not config-only
placeholders.

## Compound API

```ts
type DropdownItemProps = DisabledState & {
  children?: React.ReactNode;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  onSelect?: (event: Event) => void;
};

type DropdownGroupProps = {
  label?: string;
  children: React.ReactNode;
};

type DropdownSubMenuProps = {
  children: React.ReactElement<DropdownItemProps, typeof Dropdown.Item>;
  menu: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};
```

Expose `Dropdown.Item`, `Dropdown.Group`, `Dropdown.Separator`,
`Dropdown.SubMenu`. Item and SubMenu forward refs to their actual interactive
rows; Group and Separator forward refs to their Radix DOM elements.

Item owns its interactive row. children replaces only central label presentation;
without children render label. label supplies Radix textValue/typeahead and
explicit accessible naming for custom content. Require label when meaningful
text cannot be obtained from simple text children. Icons are decorative; custom
content must not contain additional interactive controls inside a menuitem.

Group uses Radix Group and optional Label with a semantic association. Separator
uses Radix Separator.

SubMenu follows Dropdown's trigger/content structure: `children` is exactly one
Dropdown.Item trigger and `menu` supplies the nested menu content. Trigger label,
slots, disabled state and disabled reason belong on that Dropdown.Item, not on
SubMenu. Validate trigger identity in development. Submenu
open/defaultOpen/onOpenChange follow Radix controlled/uncontrolled semantics.

The supplied Item behaves as one accessible submenu trigger, without nested
menuitems, duplicate focus stops or leaf activation. The trigger opens the submenu instead of selecting a
leaf or closing the root menu. Compose refs and preserve keyboard/pointer grace.

Automatically inject a 16px ChevronRight into the trigger Item's `rightIcon`.
This overrides a supplied rightIcon on submenu triggers; rightSlot remains
independent. Do not render an additional trailing chevron. Data-driven submenu
nodes have the same trigger presentation and behavior as authored SubMenu usage.

Render row parts in order:

`leftSlot → leftIcon → central label/content → rightIcon → rightSlot`

All supplied parts render independently. Icons never replace slots. Slots do not
shrink icons or force the central label beyond available width. Submenu
triggers automatically use their rightIcon slot for the submenu arrow.

## Interaction and accessibility

Menus support roving focus, typeahead, pointer interaction, Escape/outside
dismissal and focus restoration. Preserve default modal behavior. Enabled item activation closes the menu unless its onSelect event is
default-prevented; call onSelect exactly once.

Submenus support pointer grace and keyboard entry/exit. Escape/arrow navigation
must return focus correctly through nested menus. Portaled submenus retain root
context and are independently collision-constrained.

DisabledState is exclusive: prefer disabledReason, use disabled when no reason
is intended. A nonempty reason disables; reject empty reasons and both props in
development. Expose aria-disabled/data-disabled. Disabled items are excluded from
navigation and activation; disabled submenus cannot open. Preserve hover tooltips for disabled reasons.

A disabled root blocks trigger activation and renders no open content, including
when controlled open=true. Retain the caller's controlled value; when re-enabled,
that value governs again. Do not invoke onOpenChange during render. If an open
submenu becomes disabled, hide it under the same effective-open rule. Closing a
menu must not restore focus to an element that can no longer receive focus.

Root reason tooltip wraps the trigger without introducing a focusable wrapper.
Regular tooltip content and reason share one tooltip with an 8px gap.

## Menu design

- Width 220–360px, capped by viewport/Radix available width. Narrow-view safety
  takes precedence over minimum width.
- Max height min(420px, 100vh - 48px, Radix available height).
- Vertical padding spacing.2 (8px), radius.surface (8px), base.bg.
- Thin base.divider ring plus boxShadow.dropdown.
- zIndex.dropdown, above popovers.
- Root opens below/end aligned, offset 4px; retain collision handling.
- Submenus offset 2px, shifted upward 5px; collision handling can adjust this.
- Trigger retains focused visual treatment while open.
- Sections gap spacing.1.5 (6px); items in a group spacing.0.5 (2px).

### Rows

- Inset spacing.1.5 (6px) horizontally.
- Padding spacing.2 (8px) vertically, spacing.2.5 (10px) horizontally.
- Nominal height 30px: 14px line + 16px vertical padding. Allow larger custom
  content to grow; do not clip it to a fixed height.
- radius.control (6px).
- fontSize.label (13px), lineHeight.3.5 (14px), regular 400.
- Right-slot text uses medium 500 at the same size.
- Icon boxes 16px; parts gap spacing.2.5 (10px).
- Submenu chevron 16px.
- Default label truncates to one line, with full-label tooltip when truncated.
- Hover, keyboard highlight and active/open submenu row use base.hoverBg,
  120ms ease. This is an action menu; do not add selection state.
- Disabled text mixes base.fg 50% into base.bg, default cursor.

### Headings, separators and shell

- Group label: mono, micro 11px, lineHeight.3 (12px), regular, uppercase,
  base.fgMuted, padding 8px vertically / 16px horizontally.
- Separator: 1px base.divider, vertical margin 4px.
- Contract groups get a separator before each group except the first visible
  section; avoid duplicates beside explicit separators. Do not show automatic
  leading/trailing separators or separators for empty contract groups.
- Shell order: header, scrolling list, footer. Header/footer are optional.
- Separator below header/above footer only when the adjacent list has content.
- Header/footer remain outside scrolling list. Constrain shell and give list
  min-height:0; account for shell padding and fixed content in available height.

## Examples

```tsx
<Dropdown items={[
  { type: "item", key: "rename", label: "Rename", onSelect: rename },
  { type: "submenu", key: "share", label: "Share", items: [
    { type: "group", key: "links", label: "Links", items: [
      { type: "item", key: "copy", label: "Copy link", onSelect: copyLink },
    ] },
  ] },
]}>
  <DropdownButton>Actions</DropdownButton>
</Dropdown>
```

```tsx
type Action = { id: string; title: string; run: (event: Event) => void };
const actions: readonly DropdownEntry<Action>[] = [
  { type: "submenu", key: "share", label: "Share", items: [
    { type: "group", key: "links", label: "Links", items: [
      { id: "copy", title: "Copy link", run: copyLink },
    ] },
  ] },
];
<Dropdown items={actions} itemRenderer={action => (
  <Dropdown.Item key={action.id} label={action.title} onSelect={action.run}>
    <ActionContent action={action} />
  </Dropdown.Item>
)}>
  <Button>Actions</Button>
</Dropdown>
```

```tsx
<Dropdown menu={
  <>
    <Dropdown.Item label="Rename" onSelect={rename} />
    <Dropdown.Separator />
    <Dropdown.SubMenu menu={
      <>
        <Dropdown.Group label="Links">
          <Dropdown.Item label="Copy link" onSelect={copyLink} />
        </Dropdown.Group>
        <Dropdown.Separator />
        <Dropdown.Item label="Invite people"
          disabledReason="You need permission to invite people" />
      </>
    }>
      <Dropdown.Item label="Share" />
    </Dropdown.SubMenu>
  </>
}>
  <Button>Actions</Button>
</Dropdown>
```


## Required comment for silent disabling

Prefer disabledReason, which explains the unavailable action to the user.
When using a disabled value that can be true, require a nearby source comment
explaining why a user-facing reason is intentionally omitted. This is enforced
by a repository ESLint rule, not a component prop or TypeScript type.

Use the marker `disabled-justification:` followed by a nonempty explanation.
For JSX, put the comment immediately before the disabled attribute:

```tsx
<Button
  // disabled-justification: The surrounding panel already explains unavailability.
  disabled={isUnavailable}
>
  Save
</Button>
```

For data contracts, put the comment immediately before the disabled property:

```ts
const item: DropdownItemData = {
  type: "item",
  key: "save",
  label: "Save",
  // disabled-justification: The surrounding panel already explains unavailability.
  disabled: isUnavailable,
};
```

Require the comment for true and boolean expressions; omitted disabled and
literal false are exempt. Line/block comments are accepted immediately before
the attribute/property. Empty explanations are invalid.

No justification property is added to the public API. Comments are developer
information only and do not affect rendering or disabled behavior. TypeScript
continues to enforce disabled/disabledReason exclusivity.
