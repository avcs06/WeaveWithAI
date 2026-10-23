# UI rules

## Components

- Every component is accessible: correct roles, accessible names and states, and usable by keyboard and screen reader.
- Every component ships with tests in `<Name>.test.tsx`: its behavior, and axe on each state (`renderUI` and `axe` from `test-utils`).
- Every component ships with stories in `<Name>.stories.tsx`, following the existing ones. All of a component's stories go on a single page: every style, variant, size and state that applies, and a toggle to turn each feature on and off.
- Don't restate styles the global styles already set in global-vanilla.css.ts, such as the font family.
- Comments explain what the code can't say. No comments that repeat a name or the obvious.
- A component's types go in `<Name>.types.ts`; the component file imports them.

## Recipes

- `variant` picks the color scheme, `size` everything that scales with the component (padding, gaps, font and icon sizes), and `look` every other style: space-separated tokens in any order, read with `createLook` (`look="outline !elevated"`).
- A true/false style's token is its name, and `!name` turns it off; any other style's tokens are its values. Unknown tokens are ignored.
- A color scheme sets the color vars and a look uses them, so every look works with every color scheme.
- States like disabled, closable or checked aren't recipe variants: style them from `data-*` attributes.

## Customization

- Every customizable container or content inside a component carries a `data-slot` attribute, so consumers can target it with `[data-slot="…"]`.
- Add a `<part>ClassName` prop (`menuClassName`, …) only for content that renders outside the component's root, hoisted or portalled, where a descendant selector can't reach it. No className props for other slots.

## Disabled state

Native `disabled` is not used on any interactive element, including Checkbox, Radio and Switch: a natively disabled element gets no pointer events, so its tooltip, including the disabled reason, never shows.

Instead, a disabled element:

- sets `data-disabled` (for styles) and `aria-disabled` (for assistive tech);
- leaves the tab order with `tabIndex={-1}`, as a native disabled control would;
- ignores activation: clicks are blocked (default prevented) and the `onClick` handler is not called;
- is styled from `data-disabled`, never from `:disabled`;
- still shows its tooltip on hover, with the reason.

Disabled props, shared by controls:

- `disabled`, `readOnly` and `loading` all make the control disabled. `disableWhileLoading={false}` keeps a loading control pressable, like a button that both starts and stops a task.
- `disabledWithReason`, `readOnlyWithReason` and `loadingWithReason` give the message shown in the tooltip. A reason on its own also disables the control.
- When several apply, the message comes from the first that applies: disabled, then read-only, then loading.
- The message shows under any regular tooltip the control has.

## Icon and add-on slots

Shared by Button, Input, Select and every control with icons.

- Each side holds an icon (`leftIcon`, `rightIcon`) or an add-on (`leftAddOn`, `rightAddOn`). An icon wins over an add-on on the same side.
- Add-ons sit at the outer edges, outside the icons.
- Icons never shrink. In single-line controls (Select, for example) each icon is centered in a box as tall as the line height, so it lines up with the first line of text.
- `loading` shows a spinner in place of the left icon. When the control has only a right icon, the spinner replaces that icon instead.

## Tooltips with reasons

A control with both a regular `tooltip` and a disabled, read-only or loading reason shows both in one tooltip: the regular text first, then the reason, 8px apart.
