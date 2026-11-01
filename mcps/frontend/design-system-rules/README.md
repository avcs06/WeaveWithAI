# Design-system rules

Rules for writing the design system itself, kept out of the server:
generated apps do not follow them. The server
checks nothing under `designSystemFolders` either. They are not compiled
or run. To use one, move it under `src/model/adapters/` at the
same path, list it in its adapter's registry, and add what it reads.

| File | Rule id | What it flags | Reads |
| --- | --- | --- | --- |
| `classnames/rules/forbidden-class.ts` | `restricted-class` | Classes the policy forbids outright, such as a bare `flex` in place of `flex-row-gap-*` | `TailwindPolicy.forbiddenClasses` |
| `classnames/rules/layout-only.ts` | `restricted-class` | A non-layout utility in a design-system file | `TailwindPolicy.layoutClasses`, `ClassNameValue.designSystem` |
| `styles/rules/forbidden-layout.ts` | `forbidden-vanilla-layout` | Display, flex and alignment properties in a style object outside `@media` | `VanillaExtractPolicy.forbiddenProperties` |
| `styles/rules/prefer-tailwind.ts` | `prefer-tailwind` | A declaration an allowed Tailwind class expresses exactly | `VanillaExtractPolicy.tailwindEquivalents` |

`VanillaExtractPolicy` and `TailwindEquivalent` are not in `src/model/types.ts`. The
template's ESLint plugin (`template/tools/eslint/tailwind-layout-plugin.mjs`)
still has its own copies of these rules.
