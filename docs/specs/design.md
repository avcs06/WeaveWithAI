# Spec: design

Decisions: D3.1 to D3.11, and DS23 for the chain. Each stage keeps its
prompts in its folder's `prompts/`: `prompt.md` with its `input.md` user
message, and its review guides `review-peer.md` and `review-output.md`. Draw
and frame share the node guide in `06draw/prompts/nodes.md`. The theme, the
architect and invent have a peer and an output guide; catalog,
screen, draw and frame have an output guide alone.

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
idea + scope + flows ─▶ theme (the brief, then color steps, page layouts, component defaults) ─▶ 02-design/01-theme.json
scope + flows + theme ─▶ architect (screens, navigation, steps, composition, new components) ─▶ 02-design/02-architect.json
architect ─▶ catalog (widget definitions, component widths, the parts of each screen) ─▶ 02-design/03-catalog.json
catalog ─▶ screen, one call per page (box tree, instances, slot content)    ┐
        ─▶ invent, one call per new component (layout and nodes)            │ in parallel
        ─▶ draw, one call per widget (layout and nodes)                     │
        ─▶ frame, one call per used shell (layout and nodes)                ┘
   ─▶ assemble in code ─▶ 02-design/08-assemble.json ─▶ skeleton, whole-design and LAYOUT rules
   ─▶ one fix through the owning draw or frame stage ─▶ 02-design/08-assemble.md, 02-design/08-wireframes.html, 02-design/08-ds-gaps.json
Phase 7: prototype pages from 02-design/08-assemble.json ─▶ rendered checks ─▶ visual rubric
```

Each call runs the stage loop of D1.12 with its own validators and review
guides, and a fix returns a patch (F16). Each step is a pipeline stage of its
own, in `src/agents/02design/`: `design-theme`,
`design-architect`, `design-catalog`, `design-screen`, `design-invent`,
`design-draw`, `design-frame` and `design-assemble` (code). Each writes its
artifact to `02-design/NN-name.json` in the run. Screen, invent, draw and
frame read only what the architect and catalog wrote, so they run in
parallel. Assembly sends an issue back once through the draw or frame
stage's fix, which writes a new version of that stage's artifact; an
architect mistake it finds is a known issue, left to the coding agent.

The chain splits the work by what a model does well (DS23, user,
2026-10-31). The creative calls decide: the architect plans the screens and
their composition, and invent draws the new components. The labor calls
define and place: catalog defines each widget once, and screen lays out each
page. Draw and frame expand definitions into layout and nodes. A processing
step in code works out everything that follows from a call's answer before
its rules run: access, required states, fields and minimum widths; assembly
adds heading sizes and the copy deck. The architect reasons at high
and drafts at 0.7; invent reasons at medium and drafts at 0.7; catalog,
screen, draw and frame run at medium and 0.2; every fix runs at medium and
0.2 (D1.13 C).

## Inputs

- `01-flows/01-scope.json`, `01-flows/04-reconcile.json` (same version the contract stage uses)
- The idea text, for style cues ("calm", "like Linear", "for kids")
- The design-system inventory (`src/ds/inventory.ts`): the theme, architect,
  catalog, draw and frame prompts get it as prose (`inventoryProse` in `src/ds/prose.ts`: name,
  description, sizes, looks, defaults and measured boxes); validators get the
  full inventory.
- Token keys from the inventory: spacing keys (`0`, `0.25`, `0.5` ... `16`),
  radius keys, font sizes.

## Theme: one call, the brief and its values (D3.3 F)

The theme call decides the app's direction and writes every final value in
one answer (user, 2026-11-01). It runs at high reasoning on the strong model
and drafts at temperature 0.7 (fixes at 0.2), with a 32k budget. Its prompt
(`01theme/prompts/prompt.md`) gets the idea, the scope, what each flow is
(id, name, role, category, auth kind and goal; the frame needs no steps), the
font lists, a table of 12 named hues with their OKLCH degrees, which code
fills with culori from one reference color per name (DS26), how code makes a
ramp, and the design system as prose. `makeThemeSchema(inventory)` in
`01theme/schema.ts` is built from the inventory, so the call writes spacing
keys the design system has and each component's own values.

The answer starts with the brief, the direction the later stages read
(`01theme/brief.ts`):

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
  frameHue: z.number(),      // the header's, sidebars' and footer's
  frameChroma: z.enum(['neutral', 'muted', 'balanced', 'vivid']),
  baseHue: z.number(),       // the base set most components use (secondary buttons, inputs, cards, tables, menus)
  baseChroma: z.enum(['neutral', 'muted', 'balanced']),
  statusHues: { success, warning, error, info },  // each inside its band (BRIEF-007); the theme's own status colors
  fonts: z.object({  // three candidates per role, best first; the first is used (DS26)
    ui: z.array(z.object({ family: z.enum(UI_FONTS), reason: z.string() })),
    display: z.array(z.object({ family: z.enum(DISPLAY_FONTS), reason: z.string() })),
    mono: z.array(z.object({ family: z.enum(MONO_FONTS), reason: z.string() })),
  }),
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

`UI_FONTS`, `DISPLAY_FONTS` and `MONO_FONTS` in `src/agents/02design/01theme/fonts.ts` come from the
catalog `src/agents/02design/01theme/google-fonts.json` (user, 2026-10-30): the families
`next/font/google` exports with a latin subset and a Google popularity under
120, 193, most popular first, each with its weights, whether it is variable,
Google's category and popularity, a one-line description the theme prompt
shows, and its `use`: the one role it suits best, chosen once by hand. Text
faces with the design system's 400 to 700 weights are ui; faces made for large
sizes (condensed, wide, heavy, decorative, or named for display) are display;
monospaced faces are mono. Each list holds the families of one use, so a
brief picks three different families. The lists are sorted most popular
first and a model favors the top of a list, so the brief names three
candidates per role, each with a reason, and the first is used (DS26). The
catalog was made once and is not regenerated.

Then the logo and the values. The logo is the app's name as a wordmark (user,
2026-11-01): the app ships no image files and the design system has no icons
for a mark. Each mode gives it a color step, and THEME-011 checks its weight
and its 3:1 on the frame and the page. The wireframes draw a frame node whose
`what` says wordmark in its style, and the design summary names it.

```ts
logo: { font: 'ui' | 'display' | 'mono', weight, case, letterSpacing },
colors: [{ mode, background, theme, base, page, logo, entities }],  // each mode the brief's colorScheme names, once
  // background: the mode's page background, one CSS value of colors and gradients
  // theme: StepSet (the 12 roles, the brand's), base: StepSet (the set most components use)
  // page: { pageBg, pageFg, pageFgMuted, frameBg, divider, backdrop, skeleton }, each a ramp step
  // logo: the wordmark's color, a ramp step
  // status: { success, warning, error, info }, a StepSet each, from a ramp at the brand's chroma, at least balanced
  // entities: [{ noun, steps: StepSet }], one per colored entity
layouts: { app: PageLayout, marketing: PageLayout },
defaults: { [Component]: { [variant]: value, look: value } },  // components whose recipe has defaults or looks
```

Code builds a 12-step OKLCH ramp, in each mode, for each hue and chroma the
brief names: the brand, the base set, the frame and each colored entity. No
ramp exists before the answer gives its hues, so the prompt says how code
makes one: each step's lightness, each chroma's strength and each step's
share of it. For each step in each mode it also lists the steps that reach
4.5:1 and 3:1 on it. Contrast follows lightness, so it takes the worst case
over every hue and chroma, which holds for any two ramps (`stepGuide` in
`ramps.ts`). The call assigns each color role to a step of its set's ramp;
the page's colors take steps from the base or the brand ramp. `buildTheme`
turns the steps into hex, so the theme keeps its shape (DS27).

The prompt asks for colors that set the mood the page should put people in.
Each mode writes its own page background, one CSS value of colors and
gradients that the feel chooses freely: a tint, a gradient, glows or a
pattern (DS35; user, 2026-11-01). `pageBg` stays a solid step: the color
under the background and the one disabled states fade into. THEME-005 keeps
the background to colors and gradients, and THEME-001 checks page text on
every color in it. THEME-010 holds the modes to the brief's `colorScheme`
and the entity sets to its colored nouns, which the schema cannot, since
both come in one answer.

The page also gets `divider`, `backdrop` and `skeleton`, which follow no hue
of the brief; THEME-009 checks they show on the colors chosen (user,
2026-10-30). The status sets are the theme's too (user, 2026-11-01).
`themed(call)` in `build.ts` makes `02-design/01-theme.json`: the brief, and
the theme, which is the call's values with hex in capitals, the brief's
fonts, radius, focus ring and density, and a contrast table of every pair
the THEME rules check. A failing pair, or a brief rule, goes back to the
call in its fix rounds.

| Theme            | Template file                  | What changes                                              |
| ---------------- | ------------------------------ | --------------------------------------------------------- |
| colors theme     | `colors.ts`                    | `colors.primary` in each mode: the 12 color roles         |
| colors base      | `colors.ts`                    | `colors.base` in each mode: the 12 color roles            |
| colors page      | `colors.ts`                    | `pageBackground`, `pageBg`, `frameBg`, `pageFg`, `pageFgMuted`, `divider`, `backdrop`, `skeleton` of `colors.surface` |
| colors entity    | `colors.ts`                    | `colors.entity.light.<name>` and `.dark.<name>`           |
| colors status    | `colors.ts`                    | `colors.status` in each mode: success, warning, error, info |
| radius           | `tokens.ts`                    | `radius.surface`, `radius.control`                        |
| focusRing        | `tokens.ts`                    | `focusRing`                                               |
| fonts            | `packages/styles/src/fonts.ts` | the `next/font/google` families behind `--font-ui`, `--font-display` and mono |
| defaults         | each recipe                    | its `defaultVariants`                                     |
| layouts, density, logo | used by the later design stages, the wireframes and the coding stage; no file |                  |

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
architect sets `framed` false, as for sign in. The layout's `main` sets the
container, the page padding, the alignment and the gap between sections for
every page of its kind; a page's `contentWidth` can only narrow its column
inside the container (user, 2026-10-30). Phones are out of scope for now.

Code turns each layout with a needed part into a shell, `SH1` for app and
`SH2` for marketing, with its needed parts as regions in the order they dock
(`resolve.ts`, user 2026-10-30), so the solver, the shell rules and the frame
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

## Screens and nodes (`src/agents/02design/schema.ts`)

Each stage's schema is built at run time from the inventory, so spacing keys
and type sizes are enums: constrained decoding then can't produce a value
that doesn't exist. A node says what it is in a short phrase ("a password
input") for the coding stage, which picks the component through the MCP; it
also names the closest design-system `component` for the validators and the
layout skeleton, which is stripped before a node reaches the coding stage
(user, 2026-10-30), so a nearest match never forces the wrong component. Its
`size` and `look` reach the coding stage only on a node that overrides the
theme's defaults, with its `overrideReason`. New components are declared by
name and referenced by it. The fixed vocabularies (screen kinds, section
kinds, node roles, states, content widths) live in
`src/agents/02design/config.ts`.

Every node carries a **box**, so a deterministic solver can compute a
rectangle per node from the inventory's measured heights and draw the screen
as lines before any code exists (the layout skeleton, DS6b; its rules come
from `specs/layout-heuristics.md`, DS6c). A screen's box tree arranges its
instances: each box lays its children in a row or a column, and each child
takes a size along it (its content, a share of what is left, or a fixed
width), so a side panel can be fixed 280 wide beside a main area that fills.

The solver (`src/agents/02design/08assemble/skeleton/skeleton.ts`) works at
1280 by 800; the MVP has no phone layout. A page's shell regions dock first,
sized by their boxes and their nodes; the content takes the space left. The
content column is centred and never wider than the viewport less the page
padding; a dialog or drawer is the inventory width of its Dialog size
(narrow sm, medium md, wide and full lg). A measured inventory height wins
over everything, a fixed height included. Single-line text that ends in an
ellipsis is one line of its type size. Multi-line text is content height:
the rules read the skeleton solved with it at one line, its minimum, and the
wireframes draw it at two to four lines picked from its id, for the picture
only (DS28). A container takes its children, its gaps,
its own padding and the measured padding of the design-system component it
is (Card, Section, Dialog, Tabs, Accordion, Popover). A field with a visible
label is the whole field, label and help line included; without one it is
its box. A wrapping row wraps, and a row that does not fit is marked
`overflowX`, not fixed. The skeleton shows the default state; nodes shown
only in other states are listed beside it. `pnpm weave wireframes
<screens.json>` writes `02-design/08-skeleton.json` and
`02-design/08-wireframes.html`.

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
  id: z.string(),            // W03.n01 in a widget, CalendarGrid.n01 in a component, SH1.n01 in a frame; S03.n07 once assembled
  parent: z.string(),        // parent node ID; "" at the top
  order: z.number().int(),
  what: z.string(),          // "a password input", "a primary button", "a progress ring"
  newComponent: z.string(),  // the declared new component this node is; ""
  component: z.enum([...dsNames, 'none']), // closest DS component, for validation; stripped before coding
  size: z.enum([...sizes, '']),            // "" for the theme's default; a size only to override it
  look: z.string(),                        // "" for the theme's default; a look it lists or base only to override it
  overrideReason: z.string(),              // why it overrides a default; "" when it uses them
  box: Box,
  layout: Layout.nullable(), // for a container with child nodes; null for a leaf
  typeScale: z.enum([...typeScaleKeys, 'none']),  // display ... micro for text; none otherwise
  text: z.string(),          // the fixed words it shows; "" when a slot or a record's value fills it
  label: z.string(),         // accessible name for icon-only controls; ""
  slot: z.string(),          // the slot it stands for: words the instance fills, such as title, or the instances it holds; ""
  sample: z.string(),        // a realistic value for a record's value or a {Noun.attribute} in its words; ""
                             // slot and sample are the calls' own; assembly fills the words and drops both
  headingLevel: z.number().int(),  // in a widget, 1 is its top heading, which takes the instance's level; 0 for none
  role: z.enum(NODE_ROLES),  // `shape` draws a visual no component expresses: `what` says what, the box sizes it
  field: z.string(),         // flow field this input edits; ""
  data: z.array(z.string()), // Noun.attribute shown; []
  flowSteps: z.array(z.string()),
  states: z.array(z.enum(STATES)),
  navigatesTo: z.string(),   // screen ID; ""
});
```

A frame's nodes are `SH1.n01`, in its regions, and show on every page that
uses the shell. `02-design/08-assemble.json` holds the assembled screens:
each screen with its `shell`, its boxes and instances, and a page's gap and
padding filled in; the two layouts' containers; the shells; every node,
renumbered to its screen with an origin map back to its widget, component or
frame; the copy deck code built; and the definitions they came from.

## The chain (DS23)

The calls in order, with what each reads and answers. A processing step in
code runs on each answer before its rules (user, 2026-10-31).

### Architect (`02architect`)

High reasoning, first draft at 0.7, peer and output reviewers. The creative
call: it plans no blocks and no layout. It reads the scope, the flows, the
brief and the theme's page layouts and defaults, and answers:

- `screens`: `S01` with a name, a `type` (page, dialog or drawer), a `route`
  for a page (`/projects/[projectId]`; "" for a dialog or drawer), the
  `parent` page that opens a dialog or drawer, a `kind` (app or marketing),
  `framed`, a `contentWidth`, `entry`, a `purpose`, a page's `title`, the
  `flowSteps` it serves, the `states` it shows beyond the required ones, and
  its `composition`: prose saying what the screen is made of and how it is
  arranged, which catalog and screen follow and the peer reviewer judges.
- `navigation`: items, each a page and the slot that draws it, fitted to the
  theme's page layouts: the app layout for a signed-in page, the marketing
  layout for a public page when the app has a framed marketing page. An
  item's label is its page's title.
- `frame`: for a screen whose frame differs from its layout's default, how
  it differs, in prose.
- `alternativesElsewhere`: an alternative with the one screen that shows it,
  when that is not every screen serving its step.
- `newComponents`: a name, a purpose, the closest design-system components
  and why they don't fit, and a description of the component's content,
  purpose, emphasis, feel and look, in the theme's terms (color set, radius,
  font, density), with one reference.
- `questions` and `impossibleSteps`: a step it cannot design as written.

Its processing step fills each screen's `access` and `roles` from its steps'
flows (`signedOut`, FL14; a subflow's step by the flows that call it), adds
its required states (a step that lists records: empty and error), and puts every
other alternative on each screen serving its step.

### Catalog (`03catalog`)

Medium reasoning, 0.2, output reviewer. One call for the whole app, which
sees every screen, so a widget that screens share is defined once. It reads
the architect's answer, the flows, the vocabulary, the content widths from
the theme's layouts, the design system as prose, and the table of possible
boxes: typical width ranges per widget kind and minimum widths per part,
such as a field 160 and a card 240. It answers:

- `widgets`: `W01` with a `kind` (a section kind), what it `holds` in a
  sentence or two, the `flowSteps` it serves, the `data` it shows
  (Noun.attribute), `containsHeading`, `repeat` (the noun its items repeat
  over, or ""), its `slots` (a name, what goes in, a width range), its
  coarse `layout` (its parts, each with its `row`, a minimum width from the
  table and `ellipsis` or `wrap` on a text part), and its widest size, a
  `maxWidthPx` or fill. No heights: heights follow content. A widget that
  serves a step shows all the step needs, so a search, its list and the
  list's empty state are one widget, and a form's actions sit in the form.
- `components`: one width range for each new component.
- `screens`: for each screen, the widgets and components it is made of, and
  `frameSteps`, the steps its frame serves, such as sign out; only a framed
  page has a frame.

Its processing step fills each widget's `fields` and required `states` from
its steps, and adds up its `minWidthPx` from the coarse layout: its parts,
gaps and padding.

### Screen (`04screen`)

Medium reasoning, 0.2, output reviewer. One call per page with the dialogs
and drawers it opens, in parallel. It reads their composition, their parts
with width ranges, slots and `containsHeading`, the content width and the
brief's voice, and answers for each screen:

- `boxes`: `S04.b1` with a `parent` ("" at the top), an `order`, a
  `direction` (row or column), a width (content, fill with a share, or
  fixed px) and an `align`.
- `instances`: `S04.p1` placing a widget or a component, `in` a box or in
  another instance's slot (`S04.p2/body`), with an `order`, a width like a
  box's within the range of what it places, a `height` (fill or free), a
  `headingLevel` when its widget contains a heading (0 otherwise), and the
  words for each words slot, such as a title and a description. The
  level-1 instance's title is the page's title.

The gap between boxes and instances is the theme's section gap, and 20 in a
dialog, so the call picks no spacing. Its output reviewer compares the box
tree with the screen's composition prose.

### Invent (`05invent`)

Medium reasoning, first draft at 0.7, peer and output reviewers. One call
per new component, the creative expansion: it turns the architect's
description into a root box, its layout and nodes (`CalendarGrid.n01`)
inside the component's width range, creative within that description,
which its peer reviewer checks. A visual no node can express, such as a ring or a timeline
bar, is a `shape` node. Look only: the component's behavior, props, keyboard
and ARIA belong to the coding stage.

### Draw (`06draw`)

Medium reasoning, 0.2, output reviewer. One widget per call, six calls at a
time; a fix sends only the nodes that change. With the
node guide. It expands each definition into its `edge` (`bordered`,
`surface`, `text` or `band`, for the coding stage), its root layout and its
nodes (`W03.n01`): design-system components, new components inside their
width range, text and lists, with its fixed words inline. A node that stands
for a slot names it, so words that differ by instance come from the
instance. The widget's top heading takes its level from the instance, the
levels below it are relative to it, and the text right under it is sized
relative to it.

### Frame (`07frame`)

Medium reasoning, 0.2, output reviewer. One call per used shell, with the
node guide: it expands the theme's frame into nodes in its regions, draws
each navigation item its pages need and each screen's frame changes, and
serves the steps catalog gave the frame, which count on every page that uses
it.

### Assemble (`08assemble`)

Code, no model. Each screen is built from its box tree: every instance
becomes its widget's or component's nodes, renumbered to the screen in
reading order with an origin map back to their own ids; slots take the
instance's words and instances; heading levels become absolute from the
instance's level, and a heading's type size follows its level (app: H1
title, H2 heading, H3 subheading, H4 body; marketing: H1 display, H2 title,
H3 heading, H4 subheading); a page's gap and padding come from its layout
and a dialog's gap is 20 with no padding; then `resolveScreens`. Code builds
the copy deck from every fixed word and slot, with its own ids, and flags a
step shown with two wordings. Then the whole-design and LAYOUT rules run.
An issue inside a widget or a frame goes back once through its draw or
frame stage's fix; an architect mistake found here is a known issue, left
to the coding agent.

## New components (D3.1 B, D3.10 A)

- Prefer DS components; a new one needs `closestExisting` (at least one DS
  name) and a `whyNotExisting` that names what's missing. The architect
  declares it with a description of its content, purpose, emphasis, feel
  and look; catalog gives it a width range; invent draws it as layout and
  nodes within that range, before assembly places it (DS23).
- Design is only look (user, 2026-10-31): a new component's behavior, props,
  keyboard and ARIA are the coding stage's.
- A new component must not reimplement a DS component under another name: an
  exact name match fails; a near match warns (DESIGN-005).
- Budget: at most 5 on the app screens (warning; `src/agents/02design/config.ts`).
- In generated apps they live in `web/app/components/<Name>/` and follow the DS
  conventions in `template/packages/ui/AGENTS.md`: types file, `.css.ts` using
  tokens, `data-slot` on parts, `data-*` for states, disabled reasons, a test
  with axe. Phase 7 builds them.
- `02-design/08-ds-gaps.json` lists each new component with purpose, closest DS
  components and screens; `.weave-cache/ds-gaps.jsonl` accumulates them across
  runs, so the components asked for most become your DS backlog.

## Validator rules

Each stage checks its own answer after its processing step, with the rules
in its folder's `validation/`: the brief, the theme, and in the chain the
architect, catalog, screen, invent, draw and frame. Invent and draw also run
the node rules on the component or widget alone, and the LAYOUT rules solved
on a page holding only it, at its minimum and maximum width, keeping the
issues inside it. A component stands there as one node holding its nodes,
as on a screen. Assembly runs the whole-design rules and
`validateLayout(screens, skeleton, inventory)`, the LAYOUT rules on the
solved skeleton. `ctx` holds flows, scope, the full inventory, and the
shells and component defaults from the theme. Nodes get the theme's
defaults (`withDefaults`) before they are checked, so "" and `base` are
checked as the size and look they resolve to.

Issues on the assembled design go back once to the stage that built what
they name (`route.ts`): a node inside a widget to its draw call, a frame's
node to its frame call, a step without its control to the widgets serving
it. The fix is a separate stage, such as `design-draw-W06-fix`, that
starts from the call's last output with the issues in the call's own ids.
The architect and catalog are never rerun and a region's box is the
theme's, so an issue on a screen, a region or the plan is recorded as
known, left to the coding agent.

Validators check what the model composes: boxes, instances, shell regions
and pages, new components, and the nodes it puts into a design-system
component's slots. A design-system component's own size, padding, height
and inner layout are stable and never checked, and neither are the dialog
widths the design system fixes (user, 2026-10-30).

### Brief and theme

| Rule      | Severity  | Check                                                                                           |
| --------- | --------- | ----------------------------------------------------------------------------------------------- |
| BRIEF-001 | mandatory | `seedHue`, `baseHue`, `frameHue` and colored entities' hues within 0 to 360; 3 to 5 personality words; 1 or 2 feel words; at most 3 colored entities |
| BRIEF-002 | mandatory | `entities` are the scope vocabulary's nouns, each once, no other                                 |
| BRIEF-003 | mandatory | Colored entities at least 30 degrees from each other and from `seedHue`; a brand or entity hue in a status band (0 to 45, 65 to 100, 135 to 180) is a warning |
| BRIEF-005 | mandatory | Each font role lists three different families from its list (DS26)                               |
| BRIEF-007 | mandatory | Each status hue sits in its band: success 135 to 180, warning 65 to 100, error 0 to 45, info 220 to 270 |
| THEME-001 | mandatory | 4.5:1 for `fg` and `fgMuted` on `bg`, `fg` on `hoverBg`, `accentFg` on `accentBg` and `accentHoverBg` for the theme, base and every entity set; `pageFg` and `pageFgMuted` on `pageBg` and `frameBg`; and the theme's and base's `fg` on `pageBg` and `frameBg`, where a link draws it; in every mode; and `pageFg` and `pageFgMuted` on every color of the page background (DS35) |
| THEME-002 | warning   | 3:1 for `border` and `focus` on `bg`, and the theme's and base's `border` and `focus` on `pageBg` and `frameBg`, a link's underline and focus ring |
| THEME-003 | mandatory | When applied to an app: the brand, base, page (divider, backdrop and skeleton included), entity and status colors in `colors.ts` are the theme's (user, 2026-10-30; status, 2026-11-01) |
| THEME-004 | mandatory | Fonts in the Google catalog with a latin subset; radius values on the DS radius scale; focus ring is halo, offset or glow |
| THEME-005 | mandatory | Every color is `#RRGGBB`, and each mode's `background` is colors and gradients only: every color parses, and it loads no image (DS35) |
| THEME-006 | mandatory | A needed header, sidebar or footer holds something; a needed sidebar has a width; the sidebars sit on different sides; a fixed container has a width; a fixed-height header or footer fits the smallest button and its padding |
| THEME-007 | mandatory | The spacing every page gets from its layout: sections 24 to 32 apart on app pages and 24 to 48 on marketing pages (H-08); the main area and each needed part pad at least their gap (H-06). Only the theme call can change these, so they are checked here and not left to the LAYOUT rules |
| THEME-009 | mandatory | `divider` and `skeleton` at least 1.1:1 on `pageBg` and `frameBg`, `skeleton` also on the base set's `bg`; `backdrop` darker than the page and the frame |
| THEME-010 | mandatory | The colors hold each mode the brief's `colorScheme` names, once, and no other; each mode a set for each colored entity, once, and no other (D3.3 F) |
| THEME-011 | mandatory | The logo's weight is one its font ships, and its color reads at 3:1 on `frameBg` and `pageBg` in each mode |
| THEME-012 | warning   | Every set's `shadow` is its ramp's darkest step: 12 in light mode, 1 in dark |
| THEME-008 | mandatory | A default that carries meaning stays the recipe's: a status, a danger or status variant, an icon-only size, a dialog's size. Other variants and every look are the theme's choice |

### Screens (static)

| Rule       | Severity  | Check                                                                                                                       |
| ---------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| DESIGN-001 | mandatory | IDs unique and well formed (`S01`, `S01.b1`, `S01.p1`, `S01.n01` once assembled, `SH1.n01`, `W03.n01` in a widget, `CalendarGrid.n01` in a component, `SH1.S04.n01` added by a frame change); boxes and instances of their screen, each once; nodes at their widget, component or region; parents in the same widget, component or region; no cycles; a frame change only for a page the frame frames |
| DESIGN-002 | mandatory | `size` is one of the component's sizes and `look` one of its looks; the component's height is the inventory's, not checked |
| DESIGN-003 | mandatory | Every node's `newComponent` is declared in `newComponents`; every declared component is used                               |
| DESIGN-004 | mandatory | Each new component has a purpose, at least one `closestExisting`, a `whyNotExisting` and a description of its content, purpose, emphasis, feel and look. Look only: no keys or ARIA (user, 2026-10-31). Checked on the architect |
| DESIGN-005 | mandatory | A new component's name isn't a DS name, ignoring case. Near match (edit distance 2 or less, or one name contains the other): warning |
| DESIGN-006 | warning   | At most 5 new components on app screens; marketing pages are not counted                                                    |
| DESIGN-007 | dropped   | No element tags in nodes (2026-10-30); the coding stage and the MCP keep native elements out                               |
| DESIGN-008 | mandatory | Every user step is served by an interactive node (`*-action`, `navigation`, `input`) on a screen whose `flowSteps` include it; a shell's node is on every page that uses the shell |
| DESIGN-009 | mandatory | Every step and alternative ID appears on at least one screen, once the architect's processing step has placed the alternatives, so a gap fails before any later call; a step in `impossibleSteps` and its alternatives are left to the reconcile stage |
| DESIGN-010 | mandatory | Every field of a user step has an `input` node with that `field`, on a screen serving the step                              |
| DESIGN-011 | mandatory | A screen's nodes show every state it has, required and extra; screens serving a `list` effect show empty and error. Loading, a field's error and a submit's progress are the design system's, and a form's result, failure or denial included, is a toast, so no state asks for them (user, 2026-10-31). The architect's list alone shows nothing |
| DESIGN-012 | mandatory | At most one `primary-action` per section. More than one per screen: warning                                                 |
| DESIGN-013 | mandatory | At most one hero section per screen; a hero has one heading, at most one text node and at most two actions                  |
| DESIGN-014 | mandatory | At most 12 inputs per section (8 to 12: warning, group or split). More than 7 interactive nodes in a section or 8 sections on a page: warning |
| DESIGN-015 | mandatory | Each page has exactly one level-1 heading; heading levels don't skip; a shell has no level-1 heading |
| DESIGN-016 | mandatory | Interactive nodes have `text` or `label`; an icon-only control (no `text`) has `label`                                      |
| DESIGN-017 | mandatory | Every page is reachable from an entry page through navigation items or `navigatesTo`, shell nodes included; every dialog or drawer has a parent page and a node that opens it |
| DESIGN-018 | dropped   | Access (2026-10-31): the architect's processing step sets each screen's and navigation item's access from the flows' `signedOut`, so no output can break it (user) |
| DESIGN-019 | mandatory | `data` entries are `Noun.attribute` with a vocabulary noun                                                                  |
| DESIGN-020 | warning   | No placeholder copy ("lorem", "TODO", "placeholder"); action text starts with a verb                                       |
| DESIGN-021 | warning   | Every app screen serves at least one flow step; marketing pages are exempt                                                 |
| DESIGN-022 | mandatory | Grid layouts have 1 to 4 columns; row and column layouts have 0                                                            |
| DESIGN-023 | mandatory | Only pages are framed, and a framed page's layout has a frame; a dialog or drawer gives its own gap and padding |
| DESIGN-024 | mandatory | Every region of a shell a page uses holds at least one node                                                                |
| DESIGN-025 | mandatory | Every navigation item is a navigation node going to its screen, in a region of a shell used by a page of the item's access |
| DESIGN-026 | mandatory | An action, navigation or input is a design-system component or a declared new component; `none` is for text, headings, media and layout boxes |
| DESIGN-027 | mandatory | A node whose size or look differs from the theme's default for its component has an `overrideReason` |
| DESIGN-028 | mandatory | The copy deck: code builds it from every fixed word and slot, with its own ids, each string once; a step shown with two wordings fails; a frame's link to a navigation item's page says the item's label, and that page's H1 says it too |
| DESIGN-029 | mandatory | Composition: widget ids like `W01`, unique; each screen's parts are widgets and declared components; every widget and component is a part of some screen; at the screen, every part placed by an instance, each instance in a box or a slot of its screen |
| DESIGN-030 | mandatory | Heading plan: on a page, the instances whose widgets contain a heading take levels: exactly one at level 1, showing the page's title, and levels never skip in reading order; a dialog or drawer has no level 1. In a widget, its top heading comes first at level 1 when it contains one, and the levels below never skip. A widget no longer keeps one level (user, 2026-10-31). In the catalog, a page with a title has a widget with a heading and a `title` words slot |
| DESIGN-031 | mandatory | Extra states: each state the architect adds to a screen is a state of one of its widgets. Required states and fields come from the processing steps |
| DESIGN-032 | mandatory | A widget's steps are each on one of its nodes and its fields each have an input; no node serves a step or edits a field the widget does not list. A frame's steps are each on one of its nodes |
| DESIGN-033 | mandatory | A widget shows exactly its states, required and extra; a form's result line the catalog never gave it fails, as the result is a toast |
| DESIGN-034 | mandatory | A navigation node has a target, unless its component changes the view in place (Tab, Tabs, Pagination, Accordion, Collapsible) |
| DESIGN-035 | mandatory | What shows notFound offers a way out: a navigation node shown then or always, going to another screen |
| DESIGN-036 | mandatory | Every navigation item names a slot that holds something, in a needed part of the layout whose frame draws it: app for a signed-in page, marketing for a public page when a framed marketing page exists (architect) |
| DESIGN-037 | mandatory | A screen's boxes nest at most three levels, and each row's minimum widths and gaps fit its width (screen) |
| DESIGN-038 | mandatory | An instance gives words for each words slot of its widget and no other; a fixed width stays inside the range of what it places; in a slot, its minimum is no wider than the slot's widest (screen) |
| DESIGN-039 | warning   | An instance set to fill its height on a page, which scrolls (screen) |
| DESIGN-040 | mandatory | Each screen's steps are served by the widgets and components the catalog lists for it, or given to its frame; only a framed page gives steps to its frame, and only its own (catalog) |
| DESIGN-041 | mandatory | A widget's minimum width fits the content width of every screen that uses it, and each slot's range fits inside its widget's; each declared component has one width range, its widest at least its narrowest (catalog); invent's root stays inside it (invent) |
| DESIGN-042 | mandatory | A `shape` node's box is fixed or fill in both directions, since it has no content to size it (invent, draw) |
| DESIGN-043 | mandatory | A page has its own route, like `/shelf`; a dialog or drawer has none. A dialog or drawer with more than 6 fields: warning, a longer form is a page (architect) |
| DESIGN-044 | mandatory | A widget draws each slot of its definition as one node naming it, a words slot with no words of its own and a parts slot with nothing inside, and no other slot; it draws each new component it holds and no other (draw) |
| DESIGN-045 | mandatory | A step that saves fields is on one screen, the one with its form; the step that opens it may sit on other screens (architect) |
| DESIGN-046 | mandatory | A widget used on several screens serves only steps every one of them serves; a part that differs, such as a header's add button, is a small widget per screen in a parts slot (catalog) |
| DESIGN-047 | mandatory | A confirmation's steps sit on a dialog of the page that asks, never on the page (architect) |
| DESIGN-048 | mandatory | A confirmation's words are one sentence each and name what is destroyed: its instances' slot words (screen), a widget's own text when it serves a confirmation (draw) |

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

- `02-design/08-assemble.md`: theme swatches with contrast ratios, fonts, the shells with
  their regions and nodes, navigation, then
  per screen: route, purpose, states, instances with their nodes as an indented
  list (`[Button default] Create project → S04 (F03.S01)`), and the new
  components with their reasons.
- `02-design/08-wireframes.html` (D3.6 D, built in DS6b): one self-contained file drawing
  each screen's skeleton at desktop width as lines. For review and the demo.

## Done when

- Every golden flow set produces the brief, the theme and every stage of
  the chain with zero mandatory issues; every theme passes THEME-001 in light and dark.
- The dashboard-editor idea declares at least one new component with reasons,
  and the gap report lists it.
- Hand-broken screens (two primary actions in a section, an input missing for a
  required field, a new component named `Button`) fail exactly DESIGN-012,
  DESIGN-010 and DESIGN-005.
- Accepted outputs are saved to `fixtures/golden/<idea>/`.
