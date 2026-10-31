# Spec: design

Decisions: D3.1 to D3.11, and DS23 for the screens. Prompts in
`src/agents/02design/`: `prompt-brief.md`, `prompt-theme.md`, `prompt-ia.md`,
`prompt-component.md`, `prompt-widgets.md` and `prompt-frame.md`, each with
its `-input.md` user message; the widget and frame prompts share the node
guide in `prompt-nodes.md`. The brief, the theme and the IA have
`review-<call>-peer.md` and `review-<call>-output.md`; the calls that build
on the IA have an output guide alone, `review-widgets-output.md` for widgets
and frames and `review-component-output.md`.

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

The page kind sets the weight (D3.1 notes). Inner pages (`kind: app`), the
task screens of the app, are design-system first: a control, a field, a table, a dialog is the
component. Public pages (`kind: marketing`) such as the landing page are visual first: the design
decides the composition, sections are built from elements and layout boxes on
the tokens, and a component is used only where it fits, mainly the interactive
ones. A component is never used because it exists; a Card around every block
or Tabs for a feature list is a defect. Prompts say this by page kind, and
the new-component budget (DESIGN-006) counts inner pages only.

## Shape

```text
idea + scope ─▶ brief call (direction: audience, look, hues, fonts) ─▶ 02-design/01-brief.json
brief + scope + flows ─▶ theme call (colors, page layouts, component defaults) ─▶ 02-design/02-theme.json
scope + flows + brief + layouts ─▶ IA call (navigation, screens, copy deck, widgets, placements, declared components)
IA ─▶ a call per new component ─▶ a call per two widgets and per used shell (parallel)
   ─▶ assembly in code ─▶ 02-design/09-assemble.json ─▶ skeleton, whole-design and LAYOUT rules
   ─▶ one fix per owning widget or frame call ─▶ 02-design/09-assemble.md, 02-design/09-wireframes.html, 02-design/09-ds-gaps.json
Phase 7: prototype pages from 02-design/09-assemble.json ─▶ rendered checks ─▶ visual rubric
```

Each call runs the stage loop of D1.12 with its own validators and review
guides. Each step is a pipeline stage of its own, in `src/agents/02design/`:
`design-brief`, `design-theme`, `design-architect` (the IA), `design-invent`
(the new components), `design-draw` (the widgets), `design-frame` (the
shells) and `design-assemble` (code). Each writes its artifact to
`02-design/NN-name.json` in the run. They run in order because each reads the
one before: the IA needs the brief's density and the theme's layouts, a widget
builds on the components it uses, and a frame fills regions the layouts
define. Assembly sends an issue back once through the draw or frame stage's
fix, which writes a new version of that stage's artifact.

Screens are built from widgets (DS23, user, 2026-10-30). The IA plans every
screen once and is never rerun: the copy deck, the widgets and where each is
placed. A call per new component designs it in full, a call per two widgets
turns their definitions into nodes, and a call per used shell fills the
frame; code assembles the screens. A widget shown on several screens is
built once, so it reads the same everywhere. The IA and the component calls
reason at high; the widget and frame calls at medium; all at temperature 0.2
(D1.13 C).

## Inputs

- `01-flows/01-scope.json`, `01-flows/04-reconcile.json` (same version the contract stage uses)
- The idea text, for style cues ("calm", "like Linear", "for kids")
- The design-system inventory (`src/ds/inventory.ts`): the theme, IA and nodes
  prompts get it as prose (`inventoryProse` in `src/ds/prose.ts`: name,
  description, sizes, looks, defaults and measured boxes); validators get the
  full inventory.
- Token keys from the inventory: spacing keys (`0`, `0.25`, `0.5` ... `16`),
  radius keys, font sizes.

## Brief (`src/agents/02design/schema.ts`)

The brief is the one call that decides the app's direction once: who uses it,
how it feels, its brand hue, fonts and shapes (D3.3 E). It runs at high
reasoning and drafts at temperature 0.7 (fixes at 0.2); its output is small and sets the whole look.
Its prompt gets the idea, the scope and the font lists, not the design
system. The theme call turns it into exact values and frames the pages.

```ts
export const Brief = z.object({
  audience: z.string(),
  personality: z.array(z.string()).describe('3 to 5 adjectives for the look and feel'),
  voice: z.string().describe('Tone of the copy, e.g. "plain, warm, second person"'),
  density: z.enum(['compact', 'comfortable', 'spacious']),
  feel: z.array(z.string()).describe("1 or 2 words for the site's style, e.g. minimal, retro"),
  colorScheme: z.enum(['light', 'dark', 'both']),
  seedHue: z.number().describe('Brand hue, 0 to 360 degrees'),
  seedChroma: z.enum(['muted', 'balanced', 'vivid']),
  pageHue: z.number(),       // the page background's hue, OKLCH degrees
  pageChroma: z.enum(['neutral', 'muted', 'balanced', 'vivid']),  // neutral: white or grey, no tint
  frameHue: z.number(),      // the header's, sidebars' and footer's
  frameChroma: z.enum(['neutral', 'muted', 'balanced', 'vivid']),
  baseHue: z.number(),       // the base set most components use (secondary buttons, inputs, cards, tables, menus)
  baseChroma: z.enum(['neutral', 'muted', 'balanced']),
  fonts: z.object({ ui: z.enum(UI_FONTS), display: z.enum(DISPLAY_FONTS), mono: z.enum(MONO_FONTS) }),
  radius: z.enum(['sharp', 'soft', 'round', 'pill']),
  focusRing: z.enum(['halo', 'offset', 'glow']),
  entities: z.array(z.object({
    noun: z.string().describe('A noun from the scope vocabulary'),
    colored: z.boolean().describe('True when users must tell its records apart at a glance'),
    hue: z.number().describe('Degrees, 0 to 360, when colored; 0 if not'),
  })).describe('Every noun of the scope vocabulary once; at most 3 colored'),
  imagery: z.enum(['none', 'icons', 'illustrations']),
  references: z.array(z.string()).describe('Style references named in the idea; []'),
});
```

`UI_FONTS`, `DISPLAY_FONTS` and `MONO_FONTS` in `src/agents/02design/01brief/fonts.ts` come from the
catalog `src/agents/02design/01brief/google-fonts.json` (user, 2026-10-30): the families
`next/font/google` exports with a latin subset and a Google popularity under
120, 193, most popular first, each with its weights, whether it is variable,
Google's category and popularity, a one-line description the brief prompt
shows, and its `use`: the one role it suits best, chosen once by hand. Text
faces with the design system's 400 to 700 weights are ui; faces made for large
sizes (condensed, wide, heavy, decorative, or named for display) are display;
monospaced faces are mono. Each list holds the families of one use, so a
brief picks three different families. The catalog was
made once and is not regenerated.

## Theme: the theme call (D3.3 E)

The theme call turns the brief into every final value, at medium reasoning
and temperature 0.2: `prompt-theme.md`, with the design system as prose, and
`makeThemeSchema(brief, inventory)` in `schema-theme.ts`. Its input is the
brief, the scope and what each flow is (id, name, role, category, auth kind
and goal; the frame needs no steps). The schema is built from the brief and the
inventory, so the call writes exactly the brief's modes, a set per colored
entity, spacing keys the design system has, and each component's own values.

```ts
colors: { light?, dark? },  // the modes the brief's colorScheme names, each:
  // theme: ColorSet (the 12 roles, the brand's), base: ColorSet (the set most components use),
  // page: { pageBg, pageFg, pageFgMuted, frameBg, divider, backdrop, skeleton },
  // entity: { [noun in camelCase]: ColorSet }, one per colored entity
layouts: { app: PageLayout, marketing: PageLayout },
defaults: { [Component]: { [variant]: value, look: value } },  // components whose recipe has defaults or looks
```

The page also gets `divider`, `backdrop` and `skeleton`, which follow no hue
of the brief; THEME-009 checks they show on the colors chosen (user,
2026-10-30). Only the status sets stay the template's for every app.
`buildTheme(brief, call)` in `theme.ts` makes `02-design/02-theme.json`: the call's
values with hex in capitals, the brief's fonts, radius, focus ring and
density, and a contrast table of every pair the THEME rules check. A failing
pair goes back to the theme call in its fix rounds.

| Theme            | Template file                  | What changes                                              |
| ---------------- | ------------------------------ | --------------------------------------------------------- |
| colors theme     | `colors.ts`                    | `colors.primary` in each mode: the 12 color roles         |
| colors base      | `colors.ts`                    | `colors.base` in each mode: the 12 color roles            |
| colors page      | `colors.ts`                    | `pageBg`, `frameBg`, `pageFg`, `pageFgMuted`, `divider`, `backdrop`, `skeleton` of `colors.surface` |
| colors entity    | `colors.ts`                    | `colors.entity.light.<name>` and `.dark.<name>`           |
| radius           | `tokens.ts`                    | `radius.surface`, `radius.control`                        |
| focusRing        | `tokens.ts`                    | `focusRing`                                               |
| fonts            | `packages/styles/src/fonts.ts` | the `next/font/google` families behind `--font-ui`, `--font-display` and mono |
| defaults         | each recipe                    | its `defaultVariants`                                     |
| layouts, density | used by the screens stage and the coding stage; no file |                                          |

Radius presets on the DS scale: sharp = surface 4px, control 4px; soft =
8px, 6px (today's values); round = 16px, 10px; pill = 16px, `9999px`.

### Page layouts

```ts
const PageLayout = z.object({
  docksFirst: z.enum(['header', 'sidebars']),  // the header and footer span the width, or the sidebars run the full height
  header: z.object({ needed, start, center, end, heightPx, sticky, overlay, padding, gap, separation }),
  sidebar, extraSidebar: z.object({ needed, side, top, bottom, widthPx, sticky, padding, gap, separation }),
  footer: z.object({ needed, start, center, end, heightPx, padding, gap, separation }),
  main: z.object({ container: z.enum(['fluid', 'fixed']), maxWidthPx, padding, align, sectionGap, fullBleed, separation }),
});
```

Slots (`start`, `center`, `end`, `top`, `bottom`) say in a few words what sits
there; a frame call fills them. `separation` is the frame background, a
divider, a shadow or none; on `main` it sets the content area off from the
frame, such as a bordered panel inset between the parts (user, 2026-10-30). Every page of a kind sits in its layout unless the
IA sets `framed` false, as for sign in. The layout's `main` sets the
container, the page padding, the alignment and the gap between sections for
every page of its kind; a page's `contentWidth` can only narrow its column
inside the container (user, 2026-10-30). Phones are out of scope for now.

Code turns each layout with a needed part into a shell, `SH1` for app and
`SH2` for marketing, with its needed parts as regions in the order they dock
(`resolve.ts`, user 2026-10-30), so the solver, the shell rules and the nodes
calls keep reading shells:

```ts
const Region = z.object({
  id: z.string(),                 // SH1.r1
  place: z.enum(['top', 'bottom', 'left', 'right']),
  overlay: z.boolean(),           // a top region drawn over the page, such as a header on a hero
  box: Box.omit({ span: true }),  // top and bottom fill the width; left and right have a fixed width and fill the height
  layout: Layout,
  holds: z.string(),              // what it carries, for the frame call
});
const Shell = z.object({ id: z.string(), name: z.string(), purpose: z.string(), regions: z.array(Region) });  // SH1
```

Regions dock in order, each on the space the ones before it left: a top bar
first spans the whole width and a sidebar under it runs below it; a sidebar
first runs the whole height. An overlay region takes no space. Each shell's
regions are filled with nodes by one frame call, so every page that uses it
shows the same frame. `resolveScreens` also gives a framed page its kind's
shell, every page its layout's gap and padding, and a node with an empty
`size` or `look` the theme's default; `base` stays as written, the design
system's plain look over the theme's.

The defaults hold for the whole app (user, 2026-10-30): S1 writes them into
each recipe's `defaultVariants`, so every component the coding stage places
follows them without being told. A node leaves `size` and `look` "" to use
them; one that must differ sets its own and says why in `overrideReason`
(DESIGN-027).

## Screens (`src/agents/02design/schema.ts`)

The schema is built at run time by `makeScreensSchema(inventory)`, so
spacing keys and type sizes are enums: constrained decoding then can't produce
a gap or a text size that doesn't exist. A node says what it is in a short
phrase ("a password input") for the coding stage, which picks the component
through the MCP; it also names the closest design-system `component` for the
validators and the layout skeleton, which is stripped before a node reaches
the coding stage (user, 2026-10-30), so a nearest match never forces the
wrong component. Its `size` and `look` reach the coding stage only on a node
that overrides the theme's defaults, with its `overrideReason`. New components are declared by name and referenced by it. The
fixed vocabularies (screen kinds, section kinds, node roles, states, content
widths) live in `src/agents/02design/config.ts`.

Every node carries a **box**, so a deterministic solver can compute a
rectangle per node from the inventory's measured heights and draw the screen
as lines before any code exists (the layout skeleton, DS6b; its rules come
from `specs/layout-heuristics.md`, DS6c). A screen's `layout` arranges its
sections (a column, or a row or grid for a side panel; its gap is between
sections and its padding is the page padding), and a section's `box` sizes it
in that layout, so a side panel can be fixed 280 wide beside a main section
that fills.

The solver (`src/agents/02design/09assemble/skeleton/skeleton.ts`) works at 1280 by 800; the MVP
has no phone layout. A page's shell regions dock first, sized by their
boxes and their nodes; the content takes the space left. The content column is centred and never wider
than the viewport less the page padding; a dialog or drawer is the
inventory width of its Dialog size (narrow sm, medium md, wide and full lg).
A measured inventory height
wins over everything, a fixed height
included; text takes its estimated lines times the type scale's line height;
a container takes its children, its gaps, its own padding and the measured
padding of the design-system component it is (Card, Section, Dialog, Tabs,
Accordion, Popover). A field with a visible label is the whole field, label
and help line included; without one it is its box. A wrapping row wraps,
and a row that does not fit is marked `overflowX`, not fixed. The skeleton shows the default state; nodes shown
only in other states are listed beside it. `pnpm weave wireframes
<screens.json>` writes `02-design/09-skeleton.json` and `02-design/09-wireframes.html`.

```ts
const Box = z.object({
  width: z.enum(['fill', 'content', 'fixed']),
  widthPx: z.number().int(),      // only when width is fixed; 0 otherwise
  height: z.enum(['fill', 'content', 'fixed']),  // DS components: content, the inventory has the height
  heightPx: z.number().int(),
  minHeightPx: z.number().int(),  // 0 for none
  span: z.number().int(),         // grid columns spanned; 1 otherwise
});

const Layout = z.object({
  direction: z.enum(['row', 'column', 'grid']),
  gap: z.enum(spacingKeys),       // 4 means 16px
  padding: z.enum(spacingKeys),   // all sides; 0 for none
  columns: z.number().int(),      // grid columns on desktop, 1 to 4; 0 otherwise
  align: z.enum(['start', 'center', 'end', 'stretch']),   // across the direction
  justify: z.enum(['start', 'center', 'end', 'between']), // along the direction
  wrap: z.boolean(),
});

const Node = z.object({
  id: z.string(),            // S03.n07
  section: z.string(),       // S03.sec2
  parent: z.string(),        // parent node ID; "" at the top of the section
  order: z.number().int(),
  what: z.string(),          // "a password input, size md", "a primary button", "the page title"
  newComponent: z.string(),  // the declared new component this node is; ""
  component: z.enum([...dsNames, 'none']), // closest DS component, for validation; stripped before coding
  size: z.enum([...sizes, '']),            // "" for the theme's default; a size only to override it
  look: z.string(),                        // "" for the theme's default; a look it lists or base only to override it
  overrideReason: z.string(),              // why it overrides a default; "" when it uses them
  box: Box,
  layout: Layout.nullable(), // for a container with child nodes; null for a leaf
  typeScale: z.enum([...typeScaleKeys, 'none']),  // display ... micro for text; none otherwise
  text: z.string(),          // visible copy; ""
  label: z.string(),         // accessible name for icon-only controls; ""
  headingLevel: z.number().int(),  // 1 to 4; 0 otherwise
  role: z.enum(NODE_ROLES),
  field: z.string(),         // flow field this input edits; ""
  data: z.array(z.string()), // Noun.attribute shown; []
  flowSteps: z.array(z.string()),
  states: z.array(z.enum(STATES)),
  navigatesTo: z.string(),   // screen ID; ""
});

const Section = z.object({
  id, screen, order, kind: z.enum(SECTION_KINDS), title, purpose,
  box: Box,        // its size in the screen layout: a main section fills, a side panel is fixed 280
  layout: Layout,
  surface: z.enum(SURFACES),  // page, frame, brand or accent: each a pair THEME-001 checks
  flowSteps,
});

const Screen = z.object({
  id, name, type: z.enum(['page', 'dialog', 'drawer']), route, parent,
  kind: z.enum(SCREEN_KINDS),  // app: design-system first; marketing: visual first
  framed: z.boolean(),         // in its kind's layout; false for sign in, dialogs and drawers
  contentWidth: z.enum(['narrow', 'medium', 'wide', 'full']),  // narrows a page's column in its container: 640, 960, 1280, the container
  layout: Layout,  // how sections are arranged: a column, or a row or grid for a side panel; a page leaves gap and padding "" for its layout's
  access: z.enum(['public', 'signedIn']), roles, purpose, entry, states, flowSteps,
});
```

A **new component** is data for its boxes and prose for everything else, so
the coding agent can build it without the design system knowing it:

```ts
const ComponentBox = Box.omit({ span: true }).extend({ padding: z.enum(spacingKeys), gap: z.enum(spacingKeys) });

const NewComponent = z.object({
  name: z.string(),                         // PascalCase; not a DS name
  purpose: z.string(),
  closestExisting: z.array(z.enum(dsNames)),
  whyNotExisting: z.string(),
  composedOf: z.array(z.string()),          // DS components and tokens it builds on
  box: ComponentBox,                        // the root
  parts: z.array(z.object({ name: z.string(), description: z.string(), box: ComponentBox })), // name becomes its data-slot
  layout: z.string(),    // sentences: how the parts are arranged and sized, with the numbers
  behavior: z.string(),  // sentences: pointer and keyboard, every state and transition, what each action calls
  props: z.array(z.object({ name: z.string(), type: z.string(), description: z.string() })),
  states: z.array(z.string()),
  keyboard: z.array(z.object({ key: z.string(), action: z.string() })),
  ariaPattern: z.string(),                  // grid, listbox, disclosure; "none" if static
  usedOn: z.array(z.string()),              // screen or shell IDs
});

const Ia = z.object({
  navigation: z.object({ items: z.array(z.object({ label, screen, access })) }),  // drawn by shell regions
  screens: z.array(Screen),
  sections: z.array(Section),
  newComponents: z.array(NewComponent),
  questions: z.array(Question),
  impossibleSteps: z.array(z.object({ step: z.string(), reason: z.string() })),
});

const ScreenNodes = z.object({ screen: z.string(), nodes: z.array(Node) });  // a screen's or a shell's
```

A shell's nodes are `SH1.n01`, in its regions (`section` is `SH1.r1`), and
show on every page that uses the shell. `02-design/09-assemble.json` holds the screens
assembled from the widgets, with each screen's `shell` and a page's gap and
padding filled in, the two layouts' containers, the shells and all nodes,
and the copy deck, widgets and placements they came from:
`{ ...ia, containers, shells: Shell[], nodes: Node[], copy, widgets, placements }`.

## Widgets (DS23, `src/agents/02design/03architect/schema.ts`)

The IA call answers `makeWidgetSchemas(inventory).Ia`:

- `screens` as above with no layout and no steps, plus an `arrangement`,
  `column` or `main-side` (one main widget beside one side panel, 300 wide),
  and a `title`, the copy id of the page title its H1 shows.
- `copy`: every visible string once, `C001`, with a kind. A node names copy
  ids, never words, so one string reads the same on every screen. A copy
  string may hold a `{Noun.attribute}` slot; a record's own value is data,
  shown through the node's `sample`.
- `widgets`: `W01` with a section kind, a purpose, its `content` in a
  sentence or two, its title and copy ids, and the steps, fields, data and
  states it serves, `repeat` for records, and the new components it uses.
- `placements`: `S04.sec1` puts a widget on a screen, with an `area` (main or
  side), a `surface` and the `headingLevel` of the widget's top heading.
  A widget keeps one level wherever it is placed, so its call writes real
  heading levels and sizes the text under them (LAYOUT-031).
- `newComponents`: declarations only (name, purpose, closest design-system
  components, why not); a component call designs each one.

A widget call answers `WidgetBatch`: per widget its `edge` (`bordered`,
`surface`, `text` or `band`, for the coding stage), its root `layout`, its
nodes (`W03.n01`, text and label as copy ids) and the rare strings it adds
(`W03.c1`). A frame call answers `FrameBuild` for a shell.

Assembly (`assemble.ts`, code): a section per placement; the widget's nodes
renumbered to the screen in reading order, with an origin map back to the
widget's own ids; text from the deck with each slot showing the sample; a
heading's type size from its level (app: H1 title, H2 heading, H3
subheading, H4 body; marketing: H1 display, H2 title, H3 heading, H4
subheading); a main area that fills and a side panel 300 wide; a page's gap
and padding from its layout and a dialog's gap 20 with no padding; then
`resolveScreens`.

## New components (D3.1 B, D3.10 A)

- Prefer DS components; a new one needs `closestExisting` (at least one DS
  name) and a `whyNotExisting` that names what's missing. The IA declares it;
  its own call, at high reasoning, designs it in full before the widgets
  that use it are built (DS23).
- A new component must not reimplement a DS component under another name: an
  exact name match fails; a near match warns (DESIGN-005).
- Budget: at most 5 on the app screens (warning; `src/agents/02design/config.ts`).
- In generated apps they live in `web/app/components/<Name>/` and follow the DS
  conventions in `template/packages/ui/AGENTS.md`: types file, `.css.ts` using
  tokens, `data-slot` on parts, `data-*` for states, disabled reasons, a test
  with axe. Phase 7 builds them.
- `02-design/09-ds-gaps.json` lists each new component with purpose, closest DS
  components and screens; `.weave-cache/ds-gaps.jsonl` accumulates them across
  runs, so the components asked for most become your DS backlog.

## Validator rules

`src/agents/02design/rules/index.ts`: `validateBrief`, `validateTheme`,
`validateIa(ia, ctx)`, `validateScreenNodes(screen, nodes, ia, ctx)`,
`validateScreens(screens, ctx)` for whole-artifact rules, and
`validateLayout(screens, skeleton, inventory)` for the LAYOUT rules on the
solved skeleton. `ctx` holds flows, scope, the full inventory, and the shells
and component defaults from the theme. Nodes get the theme's defaults
(`withDefaults`) before they are checked, so "" and `base` are checked as
the size and look they resolve to.

`src/agents/02design/07draw/validation/validation.ts` checks each call of DS23 on its own
output: `validateWidgetIa` (the IA rules on the widget IA, and the older IA
rules on the sections its placements make), `validateComponent`,
`validateBatch` and `validateWidget` (a widget's own rules, the node rules
on it alone, and the LAYOUT rules solved on a page holding only that widget,
framed as on its first placement, keeping the issues inside it),
`validateFrame`, and `validateDesign` for the assembled screens.

Issues on the assembled design go back once to the call that built what
they name (`route.ts`): a node or a section to its widget's call, a shell's
node or region to its frame call, a step without its control to the widgets
serving it. The fix is a separate stage, `design-widgets-W05-W06-fix`, that
starts from the call's last output with the issues in the call's own ids.
The IA is never rerun and a region's box is the theme's, so an issue on a
screen, a region or the plan is recorded as known.

Validators check what the model composes: layout boxes, sections, shell
regions and pages, new components, and the nodes it puts into a
design-system component's slots. A design-system component's own size,
padding, height and inner layout are stable and never checked, and neither
are the dialog widths the design system fixes (user, 2026-10-30).

### Brief and theme

| Rule      | Severity  | Check                                                                                           |
| --------- | --------- | ----------------------------------------------------------------------------------------------- |
| BRIEF-001 | mandatory | `seedHue`, `pageHue`, `frameHue` and colored entities' hues within 0 to 360; 3 to 5 personality words; 1 or 2 feel words; at most 3 colored entities |
| BRIEF-002 | mandatory | `entities` are the scope vocabulary's nouns, each once, no other                                 |
| BRIEF-003 | mandatory | Colored entities at least 30 degrees from each other and from `seedHue`; a brand or entity hue in a status band (0 to 45, 65 to 100, 135 to 180) is a warning |
| THEME-001 | mandatory | 4.5:1 for `fg` and `fgMuted` on `bg`, `fg` on `hoverBg`, `accentFg` on `accentBg` and `accentHoverBg` for the theme, base and every entity set; `pageFg` and `pageFgMuted` on `pageBg` and `frameBg`; and the theme's and base's `fg` on `pageBg` and `frameBg`, where a link draws it; in every mode |
| THEME-002 | warning   | 3:1 for `border` and `focus` on `bg`, and the theme's and base's `border` and `focus` on `pageBg` and `frameBg`, a link's underline and focus ring |
| THEME-003 | mandatory | When applied to an app: the status sets in `colors.ts` are unchanged; the brand, base, page (divider, backdrop and skeleton included) and entity colors are the theme's (user, 2026-10-30) |
| THEME-004 | mandatory | Fonts in the Google catalog with a latin subset; radius values on the DS radius scale; focus ring is halo, offset or glow |
| THEME-005 | mandatory | Every color is `#RRGGBB`                                                                         |
| THEME-006 | mandatory | A needed header, sidebar or footer holds something; a needed sidebar has a width; the sidebars sit on different sides; a fixed container has a width; a fixed-height header or footer fits the smallest button and its padding |
| THEME-007 | mandatory | The spacing every page gets from its layout: sections 24 to 32 apart on app pages and 24 to 48 on marketing pages (H-08); the main area and each needed part pad at least their gap (H-06). Only the theme call can change these, so they are checked here and not left to the LAYOUT rules |
| THEME-009 | mandatory | `divider` and `skeleton` at least 1.1:1 on `pageBg` and `frameBg`, `skeleton` also on the base set's `bg`; `backdrop` darker than the page and the frame |
| THEME-008 | mandatory | A default that carries meaning stays the recipe's: a status, a danger or status variant, an icon-only size, a dialog's size. Other variants and every look are the theme's choice |

### Screens (static)

| Rule       | Severity  | Check                                                                                                                       |
| ---------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| DESIGN-001 | mandatory | IDs unique and well formed (`S01`, `S01.sec1`, `S01.n01`, `SH1.n01`, and `W03.n01` in a widget's call); sections point at screens; nodes at sections of their screen or regions of their shell; parents in the same section; no cycles |
| DESIGN-002 | mandatory | `size` is one of the component's sizes and `look` one of its looks; the component's height is the inventory's, not checked |
| DESIGN-003 | mandatory | Every node's `newComponent` is declared in `newComponents`; every declared component is used                               |
| DESIGN-004 | mandatory | Each new component has purpose, at least one `closestExisting`, a `whyNotExisting`, an `ariaPattern`, states; interactive ones list keyboard behavior. The IA call is checked on the first three, the component call on the rest |
| DESIGN-005 | mandatory | A new component's name isn't a DS name, ignoring case. Near match (edit distance 2 or less, or one name contains the other): warning |
| DESIGN-006 | warning   | At most 5 new components on app screens; marketing pages are not counted                                                    |
| DESIGN-007 | dropped   | No element tags in nodes (2026-10-30); the coding stage and the MCP keep native elements out                               |
| DESIGN-008 | mandatory | Every user step is served by an interactive node (`*-action`, `navigation`, `input`) on a screen whose `flowSteps` include it; a shell's node is on every page that uses the shell |
| DESIGN-009 | mandatory | Every step and alternative ID appears on at least one screen or node; at the IA, on a widget, so a gap fails before any widget call |
| DESIGN-010 | mandatory | Every field of a user step has an `input` node with that `field`, on a screen serving the step                              |
| DESIGN-011 | mandatory | A screen's nodes show every state the IA lists for it; screens serving a `list` effect show loading, empty and error; screens serving a submission show invalid, submitting, error and success (success may be the submit node's `navigatesTo`). The IA's list alone shows nothing |
| DESIGN-012 | mandatory | At most one `primary-action` per section. More than one per screen: warning                                                 |
| DESIGN-013 | mandatory | At most one hero section per screen; a hero has one heading, at most one text node and at most two actions                  |
| DESIGN-014 | mandatory | At most 12 inputs per section (8 to 12: warning, group or split). More than 7 interactive nodes in a section or 8 sections on a page: warning |
| DESIGN-015 | mandatory | Each page has exactly one level-1 heading; heading levels don't skip; a shell has no level-1 heading |
| DESIGN-016 | mandatory | Interactive nodes have `text` or `label`; an icon-only control (no `text`) has `label`                                      |
| DESIGN-017 | mandatory | Every page is reachable from an entry page through navigation items or `navigatesTo`, shell nodes included; every dialog or drawer has a parent page and a node that opens it |
| DESIGN-018 | mandatory | Screens serving flows of signed-in roles are `signedIn`; navigation items to them are `signedIn`; a screen whose flows all happen signed out (signing up, signing in, a role that never signs in) is public |
| DESIGN-019 | mandatory | `data` entries are `Noun.attribute` with a vocabulary noun                                                                  |
| DESIGN-020 | warning   | No placeholder copy ("lorem", "TODO", "placeholder"); action text starts with a verb                                       |
| DESIGN-021 | warning   | Every app screen serves at least one flow step; marketing pages are exempt                                                 |
| DESIGN-022 | mandatory | Grid layouts have 1 to 4 columns; row and column layouts have 0                                                            |
| DESIGN-023 | mandatory | Only pages are framed, and a framed page's layout has a frame; a dialog or drawer gives its own gap and padding |
| DESIGN-024 | mandatory | Every region of a shell a page uses holds at least one node                                                                |
| DESIGN-025 | mandatory | Every navigation item is a navigation node going to its screen, in a region of a shell used by a page of the item's access |
| DESIGN-026 | mandatory | An action, navigation or input is a design-system component or a declared new component; `none` is for text, headings, media and layout boxes |
| DESIGN-027 | mandatory | A node whose size or look differs from the theme's default for its component has an `overrideReason` |
| DESIGN-028 | mandatory | The copy deck: ids like `C001`, unique, no text twice; every copy id the IA names is in the deck; a widget lists its title among its copy; a navigation item's label is its page's title. A widget's or frame's nodes name deck ids or strings the call adds (`W03.c1`), never a deck string again; a widget shows every string it was given; a frame's link drawing a navigation item says the item's label |
| DESIGN-029 | mandatory | Composition: widget ids like `W01`, unique; placements name a screen and a widget; every widget placed and every screen holding one; a column screen places in main only, a main-side screen one main and one side; a widget's new components are declared |
| DESIGN-030 | mandatory | Heading plan: a page places one widget at level 1, whose title is the page's; placement levels never skip in reading order; a widget keeps one level, 1 to 3 or 0. In a widget the first heading is at that level, none above it, no skips |
| DESIGN-031 | mandatory | States and fields at the IA: each state a screen lists is a widget's; a screen serving a list shows loading, empty and error, one serving a submission invalid, submitting and error; every field of a user step is taken by a widget serving the step |
| DESIGN-032 | mandatory | A widget's steps are each on one of its nodes and its fields each have an input; no node serves a step or edits a field the widget does not list |
| DESIGN-033 | mandatory | A widget shows exactly the states the IA gave it |
| DESIGN-034 | mandatory | A navigation node has a target, unless its component changes the view in place (Tab, Tabs, Pagination, Accordion, Collapsible) |
| DESIGN-035 | mandatory | What shows notFound offers a way out: a navigation node shown then or always, going to another screen |

### Rendered checks (Phase 7, on prototype pages)

Thresholds come from the DS tokens where it has an opinion (body text is
`tokens.fontSize.body`, 14px, not a generic 16px).

| Rule         | Severity  | Check                                                                                        |
| ------------ | --------- | -------------------------------------------------------------------------------------------- |
| DESIGN-R-001 | mandatory | axe: no serious or critical violations, every page and state                                  |
| DESIGN-R-002 | mandatory | Text contrast 4.5:1 (3:1 for large text) from computed styles                                 |
| DESIGN-R-003 | mandatory | Keyboard: every control reachable by Tab, focus visibly changes, no trap, order follows reading order |
| DESIGN-R-004 | mandatory | Targets at least 24 by 24 CSS px (WCAG 2.2)                                                  |
| DESIGN-R-005 | mandatory | No page-level horizontal scroll or clipped text at 1280 (`pnpm verify` already checks overflow) |
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

- `02-design/09-assemble.md`: theme swatches with contrast ratios, fonts, the shells with
  their regions and nodes, navigation, then
  per screen: route, purpose, states, sections with their nodes as an indented
  list (`[Button default] Create project → S04 (F03.S01)`), and the new
  components with their reasons.
- `02-design/09-wireframes.html` (D3.6 D, built in DS6b): one self-contained file drawing
  each screen's skeleton at desktop width as lines. For review and the demo.

## Done when

- Every golden flow set produces brief, theme, IA and nodes with zero
  mandatory issues; every theme passes THEME-001 in light and dark.
- The dashboard-editor idea declares at least one new component with reasons,
  and the gap report lists it.
- Hand-broken screens (two primary actions in a section, an input missing for a
  required field, a new component named `Button`) fail exactly DESIGN-012,
  DESIGN-010 and DESIGN-005.
- Accepted outputs are saved to `fixtures/golden/<idea>/`.
