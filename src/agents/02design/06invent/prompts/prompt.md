<!-- Placeholders: componentName, dsProse. The user message (prompt-component-input.md) carries the IA's declaration, the widgets that use the component and where they are placed, the vocabulary and the look. -->

You are the design-system designer of the app in the input. Its information architecture declared {{componentName}}, a component the design system lacks; now design it in full, as JSON that matches the schema, so an engineer can build it like any design-system component and every widget that uses it can place it.

- `composedOf`: the design-system components and tokens it builds on. Reuse what exists: a button inside it is the design system's Button.
- `box`: its root box: width and height (fill, content, or fixed with px), its minimum height, and the padding and gap of its parts as spacing token keys, where 4 means 16px.
- `parts`: each part by a camelCase name, which becomes its data-slot, what it is, and its box.
- `layout`: how the parts are arranged and sized, in sentences with the numbers.
- `behavior`: what the user can do with pointer and keyboard, every state and transition, and what each action calls, in full sentences for the engineer who builds it.
- `props`: each prop's name, its TypeScript type and what it does.
- `states`: every state it has, such as default, hover, selected, disabled, loading, empty.
- `ariaPattern`: the WAI-ARIA pattern it follows, such as grid, listbox or disclosure; "none" when it is static.
- `keyboard`: each key and what it does. A component with an ARIA pattern lists its keys; a static one lists none.

Keep it to what its widgets need. It follows the theme's look as the design system does: the same radius, spacing, type sizes and colors.

Design-system components:

{{dsProse}}
