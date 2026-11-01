# Design-system rules

Rules for writing the design system itself, moved out of the server on
2026-11-01 (user): generated apps do not follow them. They are not compiled
or run. To use one again, move it back under `src/model/adapters/` at the
same path, list it in its adapter's registry, and restore what it reads.

| File | Rule id | What it flagged | Reads |
| --- | --- | --- | --- |
| `classnames/rules/forbidden-class.ts` | `restricted-class` | Classes the policy forbids outright, such as a bare `flex` in place of `flex-row-gap-*` | `TailwindPolicy.forbiddenClasses` |
| `classnames/rules/layout-only.ts` | `restricted-class` | A non-layout utility in a design-system file | `TailwindPolicy.layoutClasses`, `ClassNameValue.designSystem` |
| `styles/rules/forbidden-layout.ts` | `forbidden-vanilla-layout` | Display, flex and alignment properties in a style object outside `@media` | `VanillaExtractPolicy.forbiddenProperties` |
| `styles/rules/prefer-tailwind.ts` | `prefer-tailwind` | A declaration an allowed Tailwind class expresses exactly | `VanillaExtractPolicy.tailwindEquivalents` |

`VanillaExtractPolicy` and `TailwindEquivalent` left `src/model/types.ts`
with them, and `class-list-limit` no longer skips design-system files. The
template's ESLint plugin (`template/tools/eslint/tailwind-layout-plugin.mjs`)
still has its own copies of these rules.
