# Input — design contract

A text field in a [FormField](FormField.md) box: the box's sizes, variants,
status, looks and colors all come from there. Shared rules are in
[packages/ui/AGENTS.md](../packages/ui/AGENTS.md).

Exported from `@packages/ui/Input`: `Input`, and `SearchInput` from its
`auxiliary.tsx`.

## Input

```ts
type InputProps = FormFieldOwnProps &
  Omit<ComponentPropsWithoutRef<'input'>, keyof FormFieldOwnProps | 'value' | 'onChange'> & {
    value: string;
    onChange: (value: string) => void;
  };
```

- Controlled only: `value` and `onChange` are required, there is no
  `defaultValue`, and `onChange` receives the new text, not the event.
- Every other prop is FormField's or a native input attribute.
- The text field is the focusable element and gets FormField's `controlProps`.
  A click anywhere in the box focuses it.
- Works with `Controller` as FormField describes: `{...field}` is all it needs.

## SearchInput

`SearchInput` is an Input for search fields: the `base` variant, a Lucide
`Search` icon on the left, and autocomplete off. Its props are Input's.

It debounces: what the user types shows at once, and `onChange` runs after a
300ms pause in typing, with the text as it is then. One pause sends one
`onChange`; typing again before it fires restarts the wait.

`value` stays the source of truth:

- When `value` changes to anything other than the text the SearchInput last
  sent, the field shows the new `value` and a pending `onChange` is dropped.
  Clearing the search from outside clears the field.
- The echo of its own `onChange` (the parent passing back what it was sent)
  never overwrites what the user has typed since.
- Unmounting drops a pending `onChange`.
