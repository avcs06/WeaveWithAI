# FormField — design contract

FormField is the wrapper of every form control. It renders the label, the
control box with its icons, add-ons, spinner and tooltip, and the help text and
status message; the control renders only what goes inside the box. It is
exported from `@packages/ui/FormField` for custom controls, and works with the
`Controller` in `@packages/ui/Form` without extra wiring. Token names refer to
`tokens.ts` and `colors.ts`. Shared rules are in [packages/ui/AGENTS.md](../packages/ui/AGENTS.md).

## Props

```ts
type FormFieldOwnProps = DisabledProps &
  Pick<IconAddonProps, 'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn'> & {
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    hint?: ReactNode;
    labelRightSlot?: ReactNode;
    helpText?: ReactNode;
    error?: string | boolean;
    warning?: string | boolean;
    success?: string | boolean;
    required?: boolean;
    size?: 'sm' | 'md';
    variant?: 'default' | 'base';
    look?: string;
    tooltip?: ReactNode;
    ref?: Ref<HTMLElement>;
  };

type FormFieldControlProps = {
  id: string;
  name: string;
  ref: Ref<HTMLElement> | undefined;
  tabIndex: 0 | -1;
  //...accessibility props for a form field
};

type FormFieldProps = FormFieldOwnProps & {
  children: (controlProps: FormFieldControlProps) => ReactNode;
};
```

`DisabledProps` and `IconAddonProps` are the ones from `packages/ui/src/utils`.

`FormFieldOwnProps` is every prop form controls share. Input and Select take
it as their own props and pass all of it to FormField; their own types add only
what is specific to them.

`controlProps` holds the attributes of the control's focusable element; they
win over the control's own attributes.

## Status

`error`, `warning` and `success` set the field's status, which colors the box's
border, its focus (the ring, or the `open` look's bottom border) and the message
(see the color tables). Each takes `true` for the style alone,
or a string, which also shows as a message below the help text. When several
are set, error wins over warning and warning over success: only the winning
status styles the field and shows its message. With none set, the status is
`default`. A status wins over `variant`.

How a status message that appears reaches screen-reader users needs to be
handled.

## Working with Controller

`Controller` hands its render function a `field` with `name`, `value`,
`onChange`, `onBlur`, `ref`, `disabled`, `required` and `error`. Input and Select
accept all of them: `value`, `onChange` and `onBlur` are their own props, the
rest are FormField's. So this is the whole wiring:

```tsx
<Controller name="email" rules={{ required: 'Enter your email' }}>
  {({ field }) => <Input label="Email" helpText="For receipts" {...field} />}
</Controller>
```

- The control's id is `id` when given, otherwise a generated one. The label's
  `htmlFor` is that id, and `aria-labelledby` points at the label, so controls
  that aren't native inputs are labelled too.
- The control's name is `name` when given, otherwise the `label`, then the
  `placeholder`, then that same id.
- `required` shows the `*` after the label and sets `aria-required` on the
  control.
- `error` sets the error status and `aria-invalid` on the control. It appears
  when validation fails and goes away when the value becomes valid, because
  `Controller` passes the current error.
- `aria-describedby` on the control lists the help text's id and the status
  message's id, for whichever is shown.
- `ref` reaches the control's focusable element, so the form focuses the first
  invalid field on submit.
- `onBlur` is the control's own and fires when focus leaves the control.
- `disabled`, `readOnly` and `loading`, with or without a reason, disable the
  control following AGENTS.md, with the reason in the box's tooltip. A disabled
  control blocks its own changes.
- No native `required`, `pattern` or other constraint attributes:
  react-hook-form does all validation, and the browser never shows its own.

## Layout

- Label, control, help text and status message stack with an 8px gap
  (`spacing.2`).
- Slots beside the control sit 8px away (`spacing.2`).
- FormField sets no width; browser defaults apply.

## Control box sizes

| Size           | Height            | Padding Y         | Padding X        | Font size                  | Line height         | Icon                       | Gap                |
| -------------- | ----------------- | ----------------- | ---------------- | -------------------------- | ------------------- | -------------------------- | ------------------ |
| `sm` (default) | `spacing.8` 32px  | `spacing.1` 4px   | `spacing.2` 8px  | `fontSize.body` 14px       | `lineHeight.6` 24px | `iconSize.body` 16px       | `spacing.2` 8px    |
| `md`           | `spacing.10` 40px | `spacing.1.5` 6px | `spacing.3` 12px | `fontSize.subheading` 16px | `lineHeight.7` 28px | `iconSize.subheading` 18px | `spacing.2.5` 10px |

- Background `base.bg`.
- Placeholder `base.fgMuted`.

## Looks

Set with `look`, following the recipe rules in AGENTS.md:

- `outline` (default): a border on all four sides, radius `radius.control` 6px.
  Focus draws the focus ring from `focusRing`.
- `open`: only a bottom border, square corners. Focus draws no ring: the bottom
  border becomes 2px in the field's focus color instead.

## Control box colors

| Variant / status | Border           | Focus color     |
| ---------------- | ---------------- | --------------- |
| `default`        | `base.border`    | `focus`         |
| `base`           | `base.border`    | `base.focus`    |
| status `error`   | `error.border`   | `error.focus`   |
| status `warning` | `warning.border` | `warning.focus` |
| status `success` | `success.border` | `success.focus` |

Hover keeps the border. The focus style shows while the control has focus,
and while the box is pressed.

Disabled: background `base.hoverBg`, the border mixed 50% into `base.bg`, text
`base.fgMuted`, default cursor.

## Label

- `fontSize.label` 13px, `fontWeight.medium` 500, `lineHeight.4` 16px.
- Color `base.fgMuted`, 4px side padding (`spacing.1`).
- Required: `*` after the text in `base.fg`, raised 2px.
- Hint icon: `iconSize.label` 14px, `base.fgMuted`, 2px from the text.
- Hint icon is Lucide `Info`; hovering or focusing it shows the hint in a tooltip.
- The label truncates to one line, with the full text in a tooltip.
- Row order: the label fills the row and holds the text, the `*` and the hint
  icon, in that order; `labelRightSlot` sits at the row's end.
- Clicking the label focuses the control, the same for every control, native
  input or not.

## Field behavior that shows

- The whole control box is clickable and carries the field's tooltip, which
  also shows the disabled reason.
- Icons, add-ons and the loading spinner in the box follow the slot rules in
  AGENTS.md.
- With an icon on a side, that side has no padding; the gap separates icon and
  content.

## Help text and status message

- `fontSize.caption` 13px, `fontWeight.medium` 500, `lineHeight.4` 16px.

| Status    | Text              | Links        |
| --------- | ----------------- | ------------ |
| `default` | `base.fgMuted`    | `base.fg`    |
| `error`   | `error.fgMuted`   | `error.fg`   |
| `warning` | `warning.fgMuted` | `warning.fg` |
| `success` | `success.fgMuted` | `success.fg` |
