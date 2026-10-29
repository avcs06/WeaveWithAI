# Spec: design

Decisions: D3.1 to D3.11. Prompts: `src/stages/design/prompt-brief.md`,
`prompt-ia.md`, `prompt-nodes.md`.

## What this stage decides

Presentation: the look (theme), the screens and how users move between them,
what sits on each screen, and which components render it. It works from the
flows and the scope, never from the contract, so it runs in parallel with the
contract stage.

The design system is **inspiration, not a cage** (D3.1 B). The prompt shows
the inventory and asks the model to use it wherever it fits. Where nothing
fits, the model declares a new component with reasons; the validator checks
the reasons, flags duplicates of DS components, and every run writes a gap
report so missing components become your DS backlog.

The page kind sets the weight (D3.1 notes). Inner pages, the task screens of
the app, are design-system first: a control, a field, a table, a dialog is the
component. Public pages such as the landing page are visual first: the design
decides the composition, sections are built from elements and layout boxes on
the tokens, and a component is used only where it fits, mainly the interactive
ones. A component is never used because it exists; a Card around every block
or Tabs for a feature list is a defect. Prompts say this by page template, and
DESIGN-006 and DESIGN-007 apply to inner pages only.

## Shape

```text
flows + scope + idea
  ├─▶ brief call ──▶ 02-brief.json ──▶ theme (code) ──▶ 02-theme.json
  └─▶ IA call (navigation, screens, sections, new components) ──▶ nodes per screen (parallel calls)
                                                                    └─▶ 02-screens.json ──▶ 02-design.md
Phase 7: prototype pages from 02-screens.json ─▶ rendered checks ─▶ visual rubric
```

Screens are generated in two steps (D3.11 B): one call fixes the information
architecture, then one call per screen fills its nodes, two to four at a time.
Each call is smaller, validation is scoped to a screen, and a failed screen
reruns alone.

## Inputs

- `01-scope.json`, `01-flows.json` (same version the contract stage uses)
- The idea text, for style cues ("calm", "like Linear", "for kids")
- The design-system inventory (`src/ds/inventory.ts`): the prompt gets the
  slim summary (name, description, variant values; about 4 KB); validators get
  the full contracts. Components the inventory lists with no props (FormControl,
  Dropdown, Menu today) skip prop checks.
- Token keys from the inventory: spacing keys (`0`, `0.25`, `0.5` ... `16`),
  radius keys, font sizes.

## Brief (`src/stages/design/schema.ts`)

```ts
export const Brief = z.object({
  audience: z.string(),
  personality: z.array(z.string()).describe('3 to 5 adjectives for the look and feel'),
  voice: z.string().describe('Tone of the copy, e.g. "plain, warm, second person"'),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  seedHue: z.number().describe('Brand hue, 0 to 360 degrees'),
  seedChroma: z.enum(['muted', 'balanced', 'vivid']),
  fonts: z.object({ ui: z.enum(UI_FONTS), display: z.enum(DISPLAY_FONTS) }),
  radius: z.enum(['sharp', 'soft', 'round', 'pill']),
  focusRing: z.enum(['halo', 'offset', 'glow']),
  entityColors: z.array(z.object({
    name: z.string().describe('camelCase set name, e.g. statusDone'),
    purpose: z.string(),
    seedHue: z.number(),
  })).describe('Extra color sets for categories the app shows, at most 4; [] if none'),
  imagery: z.enum(['none', 'icons', 'illustrations']),
  references: z.array(z.string()).describe('Style references named in the idea; []'),
});
```

`UI_FONTS` and `DISPLAY_FONTS` live in `src/config/fonts.ts`, with the weights
each needs for `next/font/google`. Start with: UI Inter, Manrope, DM Sans,
IBM Plex Sans, Source Sans 3, Work Sans, Plus Jakarta Sans; display Fraunces,
Playfair Display, Space Grotesk, Sora, Outfit, Lora, DM Serif Display. Mono
stays JetBrains Mono. Drop any family that fails a one-time `next build`.

## Theme: code, not a model (D3.3 B)

`src/stages/design/theme.ts` turns the brief into values for the files the DS
lets a project change (template `AGENTS.md`: only theme colors change; extra
sets go under `entity`; neutral and status never change).

| Brief           | Template file                         | What changes                                         |
| --------------- | ------------------------------------- | ---------------------------------------------------- |
| seed, chroma    | `colors.ts`                           | `colors.theme.light` and `.dark`: the 12 color roles |
| entityColors    | `colors.ts`                           | `colors.entity.light.<name>` and `.dark.<name>`      |
| radius          | `tokens.ts`                           | `radius.surface`, `radius.control`                   |
| focusRing       | `tokens.ts`                           | `focusRing`                                          |
| fonts           | `packages/styles/src/fonts.ts`        | the `next/font/google` families behind `--font-ui` and `--font-display` |
| density         | used by the screens stage and prototypes (control sizes, gaps); no file |

Radius presets on the DS scale: sharp = surface 4px, control 4px; soft =
8px, 6px (today's values); round = 16px, 10px; pill = 16px, `9999px`.

Palette: build each color set in OKLCH from the seed hue. Start from these
lightness targets, read off the current purple theme, then move lightness
until every contrast rule holds. Chroma scales with `seedChroma` (muted 0.5x,
balanced 1x, vivid 1.4x of the seed's chroma), lower for backgrounds.

| Role            | Light L | Dark L | Notes                                          |
| --------------- | ------- | ------ | ---------------------------------------------- |
| `bg`            | 0.96    | 0.25   | low chroma                                     |
| `hoverBg`       | 0.93    | 0.29   | also the selected fill                         |
| `border`        | 0.73    | 0.52   |                                                |
| `fg`            | 0.33    | 0.90   | text on `bg` and `hoverBg`                     |
| `fgMuted`       | 0.50    | 0.77   | secondary text on `bg`                         |
| `accentBg`      | 0.56    | 0.56   | the brand color                                |
| `accentHoverBg` | 0.52    | 0.52   |                                                |
| `accentBorder`  | 0.55    | 0.58   |                                                |
| `accentFg`      | white or near-black, whichever passes on `accentBg` |                     |
| `focus`         | = `accentBg`     | = `accentBg`     |                                        |
| `accentFocus`   | 0.47    | 0.63   |                                                |
| `shadow`        | `#000000` | `#000000` |                                           |

Use `culori` for OKLCH conversion and `wcagContrast`. The theme artifact
stores the hex values and a contrast table, so the validator and the demo can
show the ratios.

```ts
const Hex = z.string().regex(/^#[0-9A-F]{6}$/);
const ColorSet = z.object({
  bg: Hex, fg: Hex, fgMuted: Hex, border: Hex, hoverBg: Hex,
  accentBg: Hex, accentFg: Hex, accentBorder: Hex, accentHoverBg: Hex,
  focus: Hex, accentFocus: Hex, shadow: Hex,
});
export const Theme = z.object({
  theme: z.object({ light: ColorSet, dark: ColorSet }),
  entity: z.array(z.object({ name: z.string(), light: ColorSet, dark: ColorSet })),
  fonts: z.object({ ui: z.string(), display: z.string(), mono: z.string() }),
  radius: z.object({ surface: z.string(), control: z.string() }),
  focusRing: z.enum(['halo', 'offset', 'glow']),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  contrast: z.array(z.object({ set: z.string(), mode: z.enum(['light', 'dark']), pair: z.string(), ratio: z.number() })),
});
```

Applying the theme to a generated app is Phase 6 (`ts-morph` edits of the
object literals in `colors.ts` and `tokens.ts`, a regenerated `fonts.ts`), but
the function and its test can be written here.

## Screens (`src/stages/design/schema.ts`)

The schema is built at run time by `makeScreensSchema(inventory)`, so DS
component names and spacing keys are enums: constrained decoding then can't
produce a DS component that doesn't exist. New components are free strings,
checked by the validator against `newComponents`.

```ts
export const SCREEN_TEMPLATES = ['landing', 'auth', 'list', 'detail', 'form', 'dashboard', 'editor', 'settings'] as const;
export const SECTION_KINDS = [
  'hero', 'page-header', 'toolbar', 'filters', 'list', 'table', 'cards', 'detail', 'form',
  'stats', 'empty-state', 'editor-canvas', 'side-panel', 'settings-group', 'auth-form',
  'feature-grid', 'cta', 'footer', 'custom',
] as const;
export const NODE_ROLES = [
  'heading', 'text', 'primary-action', 'secondary-action', 'destructive-action',
  'navigation', 'input', 'display', 'feedback', 'media', 'container',
] as const;
export const STATES = ['default', 'loading', 'empty', 'error', 'success', 'invalid', 'submitting', 'denied', 'notFound'] as const;
export const ELEMENT_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'img', 'figure', 'figcaption', 'blockquote',
  'time', 'strong', 'em', 'hr', 'section', 'header', 'footer', 'nav', 'main', 'aside',
  'article', 'dl', 'dt', 'dd',
] as const;

export function makeScreensSchema(dsNames: [string, ...string[]], spacingKeys: [string, ...string[]]) {
  const Layout = z.object({
    direction: z.enum(['row', 'column', 'grid']),
    gap: z.enum(spacingKeys).describe('A spacing token key: 4 means 16px'),
    columns: z.number().int().describe('Grid columns on desktop; 0 for row and column'),
  });

  const Ref = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('ds'), name: z.enum(dsNames) }),
    z.object({ kind: z.literal('new'), name: z.string().describe('Declared in newComponents') }),
    z.object({ kind: z.literal('element'), tag: z.enum(ELEMENT_TAGS) }),
    z.object({ kind: z.literal('layout'), layout: Layout }),
  ]);

  const Node = z.object({
    id: z.string().describe('S03.n07'),
    section: z.string().describe('S03.sec2'),
    parent: z.string().describe('Parent node ID; "" for a top-level node of the section'),
    order: z.number().int(),
    ref: Ref,
    props: z.array(z.object({ name: z.string(), value: z.string() }))
      .describe('Variant-like props and simple flags only, e.g. variant=danger, size=md'),
    text: z.string().describe('Visible copy; ""'),
    label: z.string().describe('Accessible name for icon-only or ambiguous controls; ""'),
    headingLevel: z.number().int().describe('1 to 4 for headings; 0 otherwise'),
    role: z.enum(NODE_ROLES),
    field: z.string().describe('Name of the flow field this input edits; ""'),
    data: z.array(z.string()).describe('Values shown, as Noun.attribute, e.g. Project.name; []'),
    flowSteps: z.array(z.string()).describe('Step and alternative IDs this node serves'),
    states: z.array(z.enum(STATES)).describe('States in which it shows; ["default"] if always'),
    navigatesTo: z.string().describe('Screen ID this action opens; ""'),
  });

  const Section = z.object({
    id: z.string().describe('S03.sec1'),
    screen: z.string(),
    order: z.number().int(),
    kind: z.enum(SECTION_KINDS),
    title: z.string(),
    purpose: z.string(),
    layout: Layout,
    flowSteps: z.array(z.string()),
  });

  const Screen = z.object({
    id: z.string().describe('S01'),
    name: z.string(),
    type: z.enum(['page', 'dialog', 'drawer']),
    route: z.string().describe('Next.js route for pages, e.g. /projects/[projectId]; "" otherwise'),
    parent: z.string().describe('Page that opens this dialog or drawer; "" for pages'),
    template: z.enum(SCREEN_TEMPLATES),
    access: z.enum(['public', 'signedIn']),
    roles: z.array(z.string()),
    purpose: z.string(),
    entry: z.boolean().describe('True for pages a user can start from: landing, home, sign in'),
    states: z.array(z.enum(STATES)),
    flowSteps: z.array(z.string()),
  });

  const NewComponent = z.object({
    name: z.string().describe('PascalCase; must not be a design-system name'),
    purpose: z.string(),
    closestExisting: z.array(z.enum(dsNames)).describe('DS components you considered'),
    whyNotExisting: z.string(),
    composedOf: z.array(z.string()).describe('DS components and tokens it builds on'),
    parts: z.array(z.object({ name: z.string(), description: z.string() })),
    props: z.array(z.object({ name: z.string(), type: z.string(), description: z.string() })),
    states: z.array(z.string()),
    keyboard: z.array(z.object({ key: z.string(), action: z.string() })),
    ariaPattern: z.string().describe('WAI-ARIA pattern, e.g. grid, listbox, disclosure; "none" if static'),
    usedOn: z.array(z.string()).describe('Screen IDs'),
  });

  const Ia = z.object({
    navigation: z.object({
      model: z.enum(['top-bar', 'sidebar', 'bottom-tabs', 'none']),
      items: z.array(z.object({ label: z.string(), screen: z.string(), access: z.enum(['public', 'signedIn']) })),
    }),
    screens: z.array(Screen),
    sections: z.array(Section),
    newComponents: z.array(NewComponent),
    questions: z.array(Question).describe('Unclear flows, for reconciliation'),
    impossibleSteps: z.array(z.object({ step: z.string(), reason: z.string() })),
  });

  const ScreenNodes = z.object({ screen: z.string(), nodes: z.array(Node) });

  return { Ia, ScreenNodes, Node, Section, Screen, NewComponent };
}
```

`02-screens.json` holds the IA plus all nodes: `{ ...ia, nodes: Node[] }`.

## New components (D3.1 B, D3.10 A)

- Prefer DS components; a new one needs `closestExisting` (at least one DS
  name) and a `whyNotExisting` that names what's missing.
- A new component must not reimplement a DS component under another name: an
  exact name match fails; a near match warns (DESIGN-005).
- Budget: at most 5 per app (warning; `src/config/design.ts`).
- In generated apps they live in `web/app/components/<Name>/` and follow the DS
  conventions in `template/packages/ui/AGENTS.md`: types file, `.css.ts` using
  tokens, `data-slot` on parts, `data-*` for states, disabled reasons, a test
  with axe. Phase 7 builds them.
- `02-ds-gaps.json` lists each new component with purpose, closest DS
  components and screens; `.weave-cache/ds-gaps.jsonl` accumulates them across
  runs, so the components asked for most become your DS backlog.

## Validator rules

`src/stages/design/validate.ts`: `validateBrief`, `validateTheme`,
`validateIa(ia, ctx)`, `validateScreenNodes(nodes, ia, ctx)`,
`validateScreens(screens, ctx)` for whole-artifact rules. `ctx` holds flows,
scope and the full inventory.

### Brief and theme

| Rule      | Severity  | Check                                                                                           |
| --------- | --------- | ----------------------------------------------------------------------------------------------- |
| BRIEF-001 | mandatory | `seedHue` and entity hues within 0 to 360; 3 to 5 personality words; at most 4 entity sets      |
| BRIEF-002 | mandatory | Entity set names camelCase, unique, not `base`, `success`, `warning`, `error`, `info`           |
| THEME-001 | mandatory | 4.5:1 for `fg` and `fgMuted` on `bg`, `fg` on `hoverBg`, `accentFg` on `accentBg` and `accentHoverBg`, in light and dark, for theme and every entity set |
| THEME-002 | warning   | 3:1 for `border` on `bg` and for `focus` on `bg`                                                 |
| THEME-003 | mandatory | When applied to an app: neutral (`base`) and status sets in `colors.ts` are unchanged           |
| THEME-004 | mandatory | Fonts in the allowlist; radius values on the DS radius scale; focus ring is halo, offset or glow |

### Screens (static)

| Rule       | Severity  | Check                                                                                                                       |
| ---------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| DESIGN-001 | mandatory | IDs unique and well formed (`S01`, `S01.sec1`, `S01.n01`); sections point at screens; nodes at sections of their screen; parents in the same section; no cycles |
| DESIGN-002 | mandatory | DS props: names exist on the component and values are in `allowedValues` (skipped when the inventory has no props for it)  |
| DESIGN-003 | mandatory | Every `new` ref is declared in `newComponents`; every declared component is used                                           |
| DESIGN-004 | mandatory | Each new component has purpose, at least one `closestExisting`, a `whyNotExisting`, an `ariaPattern`, states; interactive ones list keyboard behavior |
| DESIGN-005 | mandatory | A new component's name isn't a DS name, ignoring case. Near match (edit distance 2 or less, or one name contains the other): warning |
| DESIGN-006 | warning   | At most 5 new components                                                                                                    |
| DESIGN-007 | mandatory | `element` refs don't use a tag a DS component supersedes: the inventory's `invalidAlternatives`, plus `button`, `a`, `input`, `select`, `textarea`, `label`, `table` from `src/config/design.ts` |
| DESIGN-008 | mandatory | Every user step is served by an interactive node (`*-action`, `navigation`, `input`) on a screen whose `flowSteps` include it |
| DESIGN-009 | mandatory | Every step and alternative ID appears on at least one screen or node                                                       |
| DESIGN-010 | mandatory | Every field of a user step has an `input` node with that `field`, on a screen serving the step                              |
| DESIGN-011 | mandatory | Screens serving a `list` effect show loading, empty and error states; screens serving a submission show invalid, submitting, error and success (success may be the submit node's `navigatesTo`) |
| DESIGN-012 | mandatory | At most one `primary-action` per section. More than one per screen: warning                                                 |
| DESIGN-013 | mandatory | At most one hero section per screen; a hero has one heading, at most one text node and at most two actions                  |
| DESIGN-014 | mandatory | At most 12 inputs per section (8 to 12: warning, group or split). More than 7 interactive nodes in a section or 8 sections on a page: warning |
| DESIGN-015 | mandatory | Each page has exactly one level-1 heading; heading levels don't skip                                                       |
| DESIGN-016 | mandatory | Interactive nodes have `text` or `label`; `IconButton` and other icon-only components have `label`                          |
| DESIGN-017 | mandatory | Every page is reachable from an entry page through navigation items or `navigatesTo`; every dialog or drawer has a parent page and a node that opens it |
| DESIGN-018 | mandatory | Screens serving flows of signed-in roles are `signedIn`; navigation items to them are `signedIn`                            |
| DESIGN-019 | mandatory | `data` entries are `Noun.attribute` with a vocabulary noun                                                                  |
| DESIGN-020 | warning   | No placeholder copy ("lorem", "TODO", "placeholder"); action text starts with a verb                                       |
| DESIGN-021 | warning   | Every screen except a landing page serves at least one flow step                                                           |
| DESIGN-022 | mandatory | Grid layouts have 1 to 4 columns; row and column layouts have 0                                                            |

### Rendered checks (Phase 7, on prototype pages)

Thresholds come from the DS tokens where it has an opinion (body text is
`tokens.fontSize.body`, 14px, not a generic 16px).

| Rule         | Severity  | Check                                                                                        |
| ------------ | --------- | -------------------------------------------------------------------------------------------- |
| DESIGN-R-001 | mandatory | axe: no serious or critical violations, every page and state                                  |
| DESIGN-R-002 | mandatory | Text contrast 4.5:1 (3:1 for large text) from computed styles                                 |
| DESIGN-R-003 | mandatory | Keyboard: every control reachable by Tab, focus visibly changes, no trap, order follows reading order |
| DESIGN-R-004 | mandatory | Targets at least 24 by 24 CSS px (WCAG 2.2); under 44 on phones: warning                     |
| DESIGN-R-005 | mandatory | No page-level horizontal scroll or clipped text at each viewport (`pnpm verify` already checks overflow) |
| DESIGN-R-006 | mandatory | The H1 and the primary action are in the first viewport on entry pages                       |
| DESIGN-R-007 | warning   | Body text at least `tokens.fontSize.body`; paragraphs 45 to 90 characters wide              |
| DESIGN-R-008 | warning   | Every computed color is a theme variable; accent covers at most 10% of the first viewport    |
| DESIGN-R-009 | warning   | Spacing between groups larger than inside them (proximity)                                   |

### Visual rubric (Phase 7, warnings only, D3.8 A)

A vision call scores each screenshot 0 to 4 on: emphasis matches purpose
(hero helps or hurts), competing focal points, overwhelm (unrelated decisions
at once), density (labels, controls and groups distinguishable), whitespace
(clarifies grouping or forces scrolling), task clarity (next action obvious,
result visible), recovery (errors fixable without losing work), coherence
(type, spacing, icons, variants consistent). Each issue must name screen,
element and reason; "looks cluttered" is rejected. Average 3 or more is a
tuning target, not a gate.

## Rendering

- `02-design.md`: theme swatches with contrast ratios, fonts, navigation, then
  per screen: route, purpose, states, sections with their nodes as an indented
  list (`[Button default] Create project → S04 (F03.S01)`), and the new
  components with their reasons.
- Optional (D3.6 D): `02-wireframes.html`, one self-contained file drawing each
  screen's sections and nodes as labeled boxes. For review and the demo.

## Done when

- Every golden flow set produces brief, theme, IA and nodes with zero
  mandatory issues; every theme passes THEME-001 in light and dark.
- The dashboard-editor idea declares at least one new component with reasons,
  and the gap report lists it.
- Hand-broken screens (two primary actions in a section, an input missing for a
  required field, a `button` element, a new component named `Button`) fail
  exactly DESIGN-012, DESIGN-010, DESIGN-007 and DESIGN-005.
- Accepted outputs are saved to `fixtures/golden/<idea>/`.
