# weave-frontend-mcp

Coding agents generate UI that drifts from the design system, because the system lives in docs,
Storybook, and reviewer heads — none of that is queryable at generation time, and nothing checks
the output afterward. This [MCP](https://modelcontextprotocol.io) server makes this repository's
design system queryable by an agent before it writes code, and its output checkable against that
same system afterward. It reads the design system from the root `designsystem.config.json`, and
gives agents the rules in [`instructions.md`](instructions.md).

## Worked example: before / after

This runs against the example design system in `examples/`, which the tests also use.

[`examples/synthetic-design-system/`](examples/synthetic-design-system/) is a small design system
(fictional tokens, one `Button` with its recipe) demonstrating the CSS-in-TS + utility
class split this MCP was built around — run it from inside there (`cd
examples/synthetic-design-system && node ../../dist/mcp/stdio.js`) to try this yourself.

An agent about to write `Button.css.ts` hardcodes a color instead of looking it up:

```ts
// before — an agent invented a hex value
import { style } from '@vanilla-extract/css';
export const bad = style({ color: '#3b5bdb' });
```

```jsonc
// validate({ "code": "..." }) response
{
  "ok": false,
  "findings": [
    {
      "rule": "hardcoded-literal",
      "severity": "error",
      "surface": "vanilla-extract",
      "line": 2,
      "column": 35,
      "message": "\"color: #3b5bdb\" hardcodes a color value instead of using a design token. The closest token is \"color.accent\".",
      "suggestion": "vars.color.accent",
    },
  ],
}
```

The agent applies the suggestion directly:

```ts
// after
import { style } from '@vanilla-extract/css';
import { vars } from '../theme.css';
export const good = style({ color: vars.color.accent });
```

```jsonc
// validate(...) response
{ "ok": true, "findings": [] }
```

## Tools

| Tool                | Purpose                                                                                                                                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list_tokens`       | List tokens, optionally filtered to one group. Call with no group first — group names vary by project (`color`, `spacing`, `iconSize`, `zIndex`, whatever the source defines).                                                                        |
| `list_components`   | The component inventory: name, description, category, which props are variant-like, and the invalid alternatives each component declares.                                                                                                             |
| `search_tokens`     | Ranked token search across names, groups, references and values — for when you know what you want but not what this system calls it.                                                                                                                  |
| `search_components` | Ranked component search across names, descriptions, categories, prop names and declared invalid alternatives (`DropdownMenu` finds the component that supersedes `dropdown-menu`).                                                                    |
| `get_recipe`        | Working examples of a component as the project uses it: one per distinct case, with when to use it. A name with no recipe of its own (a hook, a provider) returns the recipe that imports it from the workspace. An unknown name returns the recipes. |
| `validate`          | Check a JSX/TSX snippet or a style file's content. Unparseable input comes back as a finding.                                                                                                                                                         |

### What `validate` checks

Each finding names the exact constraint broken and, where derivable, the exact fix.

**Values that should be tokens**

1. **Hardcoded literals in style-defining code** — for `vanilla-extract`, that's `style()` and
   `styleVariants()` (from `@vanilla-extract/css`) and `recipe()` (from the separate
   `@vanilla-extract/recipes` package), including everything nested inside `selectors`,
   media-query and variant objects, quoted pseudo-selector keys included. In a system that splits
   styling between a CSS-in-TS library and utility classes, this is where most real token
   violations live.
2. **Hardcoded literals in JSX** — an inline `style={{...}}` prop, and utility-class arbitrary
   values (`text-[#1e1e22]`, `p-[13px]` under `tailwind`), which step outside the design system's
   scale by construction.

The `suggestion` on these comes from a value-to-token reverse index built at load time: nearest
color for a hex value, nearest numeric token for spacing, radius and the like — the fix an agent
can apply in one pass.

**Wrong implementations**

3. **Unknown variant value** — a variant-like prop set to a value outside its allowed set, with
   the allowed set named in the message.
4. **An invalid alternative to a design system component** — reaching for a raw `<button>`, or for
   some other library's `MuiButton`, when the system has a `Button` of its own. A component
   declares what it supersedes with an `@invalidAlternative` JSDoc tag, naming native elements and
   components alike:

   ```tsx
   /**
    * Primary interactive control for triggering an action.
    * @invalidAlternative button, MuiButton
    */
   export function Button(props: ButtonProps) {
     /* ... */
   }
   ```

   Declarations use CSS selector syntax, so a component can name a tag _and the classes on it_ —
   which is how a layout primitive says "a plain div is fine, a div doing my job is not":

   | Declaration                            | Matches                                                       |
   | -------------------------------------- | ------------------------------------------------------------- |
   | `button`                               | any `<button>`                                                |
   | `MuiButton`                            | another library's component                                   |
   | `div.flex`                             | a `<div>` carrying the class `flex`                           |
   | `div.flex.gap-2`                       | a `<div>` carrying both classes                               |
   | `.flex`                                | any element carrying `flex`                                   |
   | `Input[type="password"]`               | the `Input` component with `type="password"`                  |
   | `input[disabled]`                      | an `<input>` with a `disabled` attribute                      |
   | `input:not([type="hidden"])`           | an `<input>` unless it is `type="hidden"`                     |
   | `Form.Item`                            | a dotted component, `<Form.Item>`                             |
   | `import('@radix-ui/react-tabs')`       | anything imported from that package                           |
   | `import('@mui/material'){Button, Tab}` | only those named imports, and `<Button>` or `<M.Button>`      |
   | `import('some-lib'){default}`          | the default export                                            |
   | `import('@radix-ui/react-*')`          | every package matching the glob                               |
   | `import('*/components/ui/button')`     | a module at that path under any prefix, or none (`@/`, `../`) |

   Separate entries with commas or newlines; several `@invalidAlternative` lines are fine. Write a
   scoped package name only inside `import('…')`, because a bare `@scope/pkg` is split off by
   JSDoc as a new tag.

   Tags are case-sensitive, as in JSX: `input` is the native element, `Input` a component. In a
   dotted tag a capitalized segment is a member (`Form.Item`, `Input.Password`) and a lowercase
   one is a class (`div.flex`). `:not()` takes classes and attributes only, no tag and no
   nesting. In `import('pkg'){A, B}`, `*` stands for any characters, and a leading `*/` means
   any prefix or none.

   Files inside the owning component's folder are exempt, since they implement it; so is every
   design-system file for element matches, because the system builds its controls from native
   elements.

   All the classes named must be present; extras are ignored, so `div.flex` matches
   `className="flex items-center"`. The classes are plain literals you wrote — this is unrelated
   to the Tailwind className rules.

   Any way of writing the value is read, including through a helper — `cn`, `clsx`, `classNames`,
   `twMerge` or your own, since the name of the call is never inspected:

   ```tsx
   <div className="flex items-center" />
   <div className={cn('flex', isActive && 'gap-2')} />
   <div className={clsx({ flex: isRow })} />   // class as key
   <div className={`flex ${extra}`} />
   ```

   An attribute value is read from a string, number or boolean literal (a bare attribute is
   `true`), a template without expressions, either branch of a ternary, and the keys and
   literals of a spread object literal (`{...{ role: 'menu' }}`). `type`, `role`, `inputMode` and
   `popover` compare case-insensitively. A value that can't be read (`role={r}`, an unreadable
   `{...props}`) is unknown: it never satisfies a positive selector, and never satisfies
   `:not()` either, so `<input {...props} />` is not flagged by `input:not([type="hidden"])`.

   Imports are checked wherever a module is named: `import`, `export … from`, `export * from`,
   `require()` and dynamic `import()`, including `.then((m) => m.A)`, `require('x').A` and a
   destructured `require`. A whole-package declaration is reported once, at the module
   reference. A named declaration reports the import and each place the name is rendered or
   read, through an alias or a namespace too. Type-only imports are ignored.

   Where two declarations both match, the more specific one wins, comparing positive classes and
   attributes first, then `:not()` parts, then the tag; a tie goes to the first declared. Several
   components may declare the same package for different names, and an exact module beats a
   glob. An invalid alternative is always an error.

   A declaration that can't work is reported by `diagnostics()` instead of being ignored: an
   unreadable selector or import, empty `{}` names, a bare `@scope/pkg`, or a selector another
   component already declared. `pnpm mcp:check` fails on them, listing each one.

**Recipes are app code.** A recipe sits in its component's folder but shows how an app uses the
component, so `validate` checks it with the general rules and without the folder's leave to use
what the component supersedes. A `.ts` file is parsed without JSX.

## Architecture

The design system model has no MCP dependency — everything under [`src/model/`](src/model/)
(config loading, adapters, `validate`) is plain TypeScript that knows nothing about the protocol;
[`src/mcp/`](src/mcp/) is a thin layer that registers tools, calls the model, and formats the
result. That split is deliberate: the model is meant to be reusable by something other than an MCP
server later (a CLI, a lint rule), and a tool handler containing logic beyond formatting would be
a bug rather than a feature.

Four adapters, each owning one folder: `components-adapter` reads component contracts, and the
three validators — `tsx-adapter`, `styles-adapter`, `classname-adapter` — check code. An adapter
contains no library-specific code of its own, so swapping a styling system or component format
never touches the callers. A helper lives next to what uses it: inside its concern's folder,
never in a shared grab-bag.

**Every check is a rule.** A rule is one file under its validator's `rules/` folder — a function
from what it inspects to findings — listed in that validator's registry. Adding a scenario you've
seen in practice is one new file plus one line in the registry:

| Validator              | Registry: what each rule sees                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `tsx-adapter.ts`       | `fileRules`: the whole file · `importRules`: one import · `elementRules`: one JSX element |
| `styles-adapter.ts`    | `styleRules`: one style object · `inlineStyleRules`: one inline `style={{}}`              |
| `classname-adapter.ts` | `classRules`: one class (first objection wins) · `valueRules`: one `className` value      |

**Rules flag invalid implementations, not imperfect ones.** A rule checks that the valid pattern
is used — a form field goes through Controller and is connected to its `field`, a control is the
design system's component — never that the pattern is configured perfectly. Once a valid pattern
is in place, making it work with the right configuration is the coding agent's job, which it
verifies itself through its own checks and tests. A rule that tries to prove working code only
adds false positives and ends up depending on brittle details like a component's prop names.

```
src/
  model/
    types.ts                  shared domain types, including Rule<Subject> — imports nothing
    config.ts                 Zod schema + loadConfig(cwd) -> ResolvedConfig
    design-system.ts          createDesignSystem(config) -> DesignSystem: loads tokens and
                               components, builds the reverse index, holds the lookup/search API
    validate.ts               parses once with Babel, calls the two "validate" entry points below
    reverse-index.ts          value -> nearest-token lookup (color distance / numeric proximity)
    adapters/
      ast.ts                   traverse + finding position, shared by every adapter
      components-adapter.ts    loadComponents(patterns), loadPackageComponents(pkg),
                                componentRoots(patterns)
      recipes-adapter.ts       loadRecipes(patterns): recipe files by name, read when served;
                                recipeImporting(recipes, name): the recipe that imports a name
      components/
        react-tsx.ts            component contracts from project source files; type-only
                                exports (props, aliases) and exports tagged `@internal`
                                are left out of the inventory
        npm-package.ts          component contracts from an installed package's type declarations
        props.ts                docgen props -> ComponentProp, shared by both readers
      tsx-adapter.ts           validateJsx: runs the tsx rules; hands inline styles and className
                                to the other two validators
      tsx/
        modules.ts              every module reference in a file (import, re-export, require,
                                import()) and the names it brings in, with each use of them
        forms.ts                hook calls and where Controller hands over `field`, shared by the
                                form rules
        rules/
          invalid-alternative.ts     elements/imports a component declares superseded;
                                     builds the owners and their diagnostics
          unknown-variant.ts         variant prop outside its allowed set
          manual-form-state.ts       form values/errors in useState instead of react-hook-form
          field-outside-controller.ts  form field not rendered through Controller
          unlinked-controller-field.ts  Controller whose field never uses field.value/onChange or {...field}
      styles-adapter.ts        loadTokens(file) infers a token file's format; validateStyles and
                                checkStyleObject run the styles rules
      styles/
        vanilla-extract.ts      loadTokens() (createThemeContract/createGlobalTheme) and
                                styleObjects() (style()/styleVariants()/recipe() calls)
        object.ts               loadTokens() for a plain JS/JSON file
        flatten-object-literal.ts  AST helper both token readers use
        rules/
          forbidden-layout.ts   layout properties reserved for Tailwind
          hardcoded-literal.ts  a literal where a design token belongs
          prefer-tailwind.ts    declarations an allowed Tailwind class replaces exactly
      classname-adapter.ts      check(policy, value) runs the className rules;
                                classNameTokens(value) reads the classes off a className
      classnames/
        class-name-strings.ts   reads the strings off a className, whatever expression shape it
                                takes — knows no className convention
        rules/
          restricted-syntax.ts  variants, arbitrary values, negative modifiers
          forbidden-class.ts    classes the policy forbids outright
          layout-only.ts        design-system files: layout utilities only
          unknown-class.ts      classes the Tailwind config doesn't generate
          class-list-limit.ts   class-list length and count outside the design system
  mcp/
    server.ts                  tool registration
    workspace.ts               serveWorkspace(config): createDesignSystem -> serveStdio
    stdio.ts                   bin: loadConfig(workspace) -> serveWorkspace
  index.ts                     public exports
```

Styles are always vanilla-extract and classNames always Tailwind — neither is configurable.
Moving to another styling system (Sass modules, styled-components) is a new file next to
`styles/vanilla-extract.ts` and switching `styles-adapter.ts` to it — neither `validate.ts` nor
`tsx-adapter.ts` changes, since they only ever call the dispatcher. Same shape for another
className convention next to `classnames/tailwind.ts`, and another component format next to
`components/react-tsx.ts`. Nothing in the config names a format: a token file's format is
inferred from its contents, `components` is always React TSX and `packages` always an installed
package's type declarations.

**Why the TSX adapter delegates instead of checking styles/classes itself.** An inline JSX
`style={{...}}` prop needs the _exact_ same governed-property check as a style-authoring call —
same properties, same token groups, same reverse index — so both run through the shared
`check-style-object.ts` rather than keeping a second copy of that logic. Utility-class checking is
unrelated (it's regex over strings, not object literals), so it's the className adapter's own
concern, reached through its dispatcher. `validate.ts` itself calls exactly two things —
`validateStyles` and `validateJsx` — because there are only two places in a file token violations
start from: a style-defining call, or a JSX element.

**Why property→group is a map, not value-matching.** Detecting a violation is structural — is this
governed property set to a literal, or to a reference into the token object? — rather than based
on whether the literal happens to match some token's value. `padding: '8px'` is wrong even when
8px equals a real token today, because it won't track that token if it changes. Value-matching is
used only to compute `suggestion`, once a violation is already established.

**Why the group list isn't fixed.** A real design system's token groups aren't knowable in advance
(some have `shadow`/`motion`, plenty don't; some split typography into `fontSize`/`fontWeight`/
`lineHeight` rather than one `typography` group), so a rule fires only when the configured token
source actually has tokens in that group.

**Why `width`/`height` aren't governed properties.** They're too overloaded — an icon's size and a
card's layout width use the same CSS property — to map onto one token group without a high
false-positive rate, so they're left unchecked.

**Why token sources aren't merged by name.** If a design system splits token _shape_ (a
vanilla-extract contract) from token _values_ (a separate JSON file), those two sources produce
separate token entries rather than one merged entry. Whoever writes the config decides which files
to list; there's no cross-file name-matching to get wrong.

## Setup

Node `^22.18.0` or `>=24.11.0` (pinned in `.nvmrc`). From the workspace that holds the design
system (`template/` in this repository):

```bash
pnpm mcp:setup   # npm install and build into dist/
pnpm mcp:check   # confirms the config loads components and tokens, and every declaration works
```

Clients start the server through the workspace's `tools/design-system-mcp.mjs`; this repository
registers it at the root in `.mcp.json` (Claude Code) and `.vscode/mcp.json` (VS Code). After
changing `src/`, run `pnpm mcp:build`; after changing `src/` or `instructions.md`, restart the
server.

`tools/generate.mjs` copies this folder into a new project without `node_modules` or `dist`, then
runs both commands there.

`pnpm verify <route>` first runs `validate` on the route's files (its folder and what they import
under `web/`), and `pnpm verify --recipes` on every recipe, then drives the browser.

## Config reference

`tokens` and `components` are lists of paths; `packages` takes one entry or an array of them.

| Field        | Purpose                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `tokens`     | Where the design tokens are. Tokens can be spread across several files or formats — list each one and they're concatenated. |
| `components` | Your workspace's own React component files. Everything under their folders is design-system code.                           |
| `packages`   | _Optional._ Installed packages whose components join the inventory.                                                         |
| `recipes`    | _Optional._ Globs for recipe files: each component's distinct cases, served by `get_recipe`.                                |
| `importExceptions` | _Optional._ Globs for files that may import a package another component supersedes, like a shared primitive several components are built on. Only the import rule skips them; everywhere else, only the declaring component's folder may use what it supersedes. |

**Tokens** (`tokens[]`) — file paths. Each file's format and exports are inferred:

- A vanilla-extract theme, when the file imports `createThemeContract`/`createGlobalTheme` from
  `@vanilla-extract/css` — reads those calls, flattening nested paths to dot-separated names. A
  `createThemeContract` leaf declares shape without a value, so it produces a token with a
  `reference` and no `value`.
- Otherwise a plain object — a JSON file, or every `export const X = {...}` in a `.ts`/`.js`
  module, flattened the same way. A module's tokens are referenced by each export's name
  (`X.color.accent`), a JSON file's by its basename, and a vanilla-extract theme's by the name
  it's bound to.

**Components** (`components[]`) — reads React component prop contracts through the real TypeScript type checker
(`react-docgen-typescript`, the same tool Storybook's autodocs use), which is what lets a variant
prop typed as `keyof typeof someTokenObject` resolve to its actual allowed values rather than
only a union written out literally. Also reads each component's `@invalidAlternative` JSDoc tag
(see above). Entries are globs; a `!`-prefixed one excludes.
Each glob is read with the `tsconfig.json` nearest its folder, which is what resolves path
aliases like a monorepo's `@app/*`.

**Packages** (`packages[]`) — reads an installed package's components from its type declarations, so an icon
library or a set of headless primitives becomes part of the queryable inventory rather than
something an agent has to guess at. Fields: `package` (the package name, resolved from your
workspace), `names` (`"*"` or omitted for everything it exports, or an array of
specific names).

**Recipes** (`recipes[]`) — globs for recipe files, each holding working examples of one
component as an app uses it: one case per distinct use (single or multiple choice, client or
server data), each with a comment saying when to use it, mentioning options like sizes once
rather than showing each. Name it after the component and keep it beside it
(`Table/Table.recipe.tsx`): a recipe covers the components declared in the file of its own name,
or in its folder's `index` barrel, and `get_recipe` finds it by either name. The file is served
as written, so make it code that typechecks and passes your lint; a test that renders every
recipe keeps them working. Recipe files are never read as components.

Style-defining code is always checked as vanilla-extract and `className` as Tailwind. The host
workspace passes its own rules for both (`vanillaExtract` and `tailwind` on the config given to
`createDesignSystem`). Every file under a `components` glob's folder is design-system code:
there, Tailwind is limited to layout utilities.

A format that isn't listed here needs a new adapter — see [Architecture](#architecture).

## Known limitations

- **A `TemplateLiteral` value is never flagged**, even a hardcoded one (e.g.
  `` `0 0 0 3px ${theme.shadow}` ``) — it often mixes a real token reference with literal
  structure, and resolving that fully isn't worth the false-positive risk.
- **A computed property key** (`{ [someVar]: '#fff' }`) is checked using the _variable's name_,
  not its runtime value — harmless unless a local variable happens to share a name with a governed
  CSS property.
- **Reading `components` needs your workspace's own dependencies installed**
  (`npm install`/`pnpm install` run there). It resolves types through the real TypeScript checker,
  so without `react`/`@types/react` and anything a component imports actually present, it detects
  zero components — which looks like a config problem when it's an install problem.
- **Scanning a large package with `names: "*"` is slow.** A full icon library (~3,400 components)
  takes several seconds at startup. Naming the specific components you use keeps it instant.
- **`@modelcontextprotocol/server` v2** (this depends on it per the SDK's own migration guidance
  away from v1's `@modelcontextprotocol/sdk`) reached `2.0.0` a few weeks before this was written.
  It's maintained by the official MCP org, but has far less real-world mileage than the v1 SDK.

## Development

From this folder:

```bash
npm run format:check   # prettier
npm run typecheck      # tsc --noEmit
npm test               # vitest, also `pnpm mcp:test` from the root
npm run build          # tsc -> dist/
```

Tests run against [`examples/synthetic-design-system/`](examples/synthetic-design-system/) — the same
fixture the worked example above uses, not a second copy that can drift from it — plus unit tests
per implementation for cases the example doesn't cover (`styles/vanilla-extract.test.ts`,
`styles/object.test.ts`) and a dispatcher-level test
(`components-adapter.test.ts`) covering how a missing `package` is reported. `createDesignSystem(config)` takes an in-memory config object,
so tests need no `designsystem.config.json` on disk.
