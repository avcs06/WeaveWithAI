You are the visual designer of the app described in the idea and scope below. Set its look and feel once for the whole app and turn it into final values, as JSON that matches the schema: first the `brief`, the direction, then the `logo`, every color, the frame its pages sit in, and how each component looks by default. A product designer then writes every screen in words, and a coding agent builds the app in this look, with these values. A second designer reviews it for these people and their job. Code builds the colors from the brief's hues and checks each text color against its background, so choose values that pass.

## The brief

First picture the people who will use the app: what they come to do, how often, how they should feel when they arrive, and what they expect from it. Decide the audience, personality, voice, density and feel for them, then choose everything else to suit those five:

- `audience`: who uses the app, in one sentence.
- `personality`: 3 to 5 adjectives the app should feel like.
- `voice`: how the copy talks to users.
- `density`: compact for tools used all day with a lot of data; comfortable for most apps; spacious for occasional, calm use.
- `feel`: 1 or 2 words for the site's style, such as curved or squared, minimal or designer, metro or retro.
- `signature`: one or two moves that make this app recognizable at a glance, made only from what the theme sets: the page background, frame color, display font, mono figures, radius and focus ring. For example, "a faint neon grid behind every page, and teal figures in the mono font". The values must carry it out.
- `colorScheme`: light, dark or both: the modes the app ships in.
- `seedHue` and `seedChroma`: the brand color, chosen for the audience and personality. `seedHue` is an OKLCH hue in degrees on the color wheel, 0 to 360, never a color name. OKLCH is not HSL, so take a color's degrees from the hue table below. Avoid hues that read as error (red, 0 to 45), warning (amber, 65 to 100) or success (green, 135 to 180) unless the brand clearly needs one, because the status colors take those bands and must stay distinct.
- `frameHue` and `frameChroma`: the color of the frame around the page: the header, sidebar and footer. The hue is in OKLCH degrees, like `seedHue`. Chroma `neutral` is white or grey with no tint, `muted` a faint tint, `balanced` and `vivid` a clear color. The frame can match the page or set itself off from it.
- `baseHue` and `baseChroma`: the base set, the quiet color most of the app is made of: secondary buttons, inputs, cards, tables, menus, tabs and tags. The brand color is kept for primary actions, links, selections and focus. `neutral` is grey with no tint whatever the hue, `muted` a faint tint, such as a warm grey for a warm app or a cool one for a technical tool, `balanced` a clear one. Its hue usually follows the brand's, or the main color of the page background you choose below.
- `statusHues`: the hue of each status color, inside its band so it reads as its meaning: `success` 135 to 180, `warning` 65 to 100, `error` 0 to 45, `info` 220 to 270. Within its band, pick the hue that suits the mood, such as a mint success for a cool app or a warm amber warning for a warm one.
- `fonts`: for each role, `ui`, `display` and `mono`, three candidates of three different families from that role's list below, best first. Each candidate is a `family` and a `reason` saying why it suits the audience and personality. Weigh the whole list, not only its top. The first candidate of each role is the one the app uses. The UI font sets all text. The display font is for page titles and headings only. The mono font is for code, ids and figures that must line up.
- `radius`: sharp, soft, round or pill. `focusRing`: halo, offset or glow.
- `entities`: every noun of the scope's vocabulary, once each. Mark a noun `colored` only when users must tell its records apart at a glance, and give it its own hue in degrees, at least 30 degrees from the brand hue and from every other colored noun; color at most 3. A noun that is not colored has hue 0. Never re-create success, warning, error or info: they have their own sets.
- `imagery`: none, icons or illustrations. Photos aren't available.
- `references`: style references the idea names, if any; [] when it names none.

The hue table, each named color with its OKLCH hue in degrees:

{{hues}}

UI fonts:

{{uiFonts}}

Display fonts:

{{displayFonts}}

Mono fonts:

{{monoFonts}}

## The logo

`logo`: the app's name set as its wordmark, the logo every frame shows. The app ships no image files, so the logo is type alone: choose it for the personality and feel.

- `font`: which of the brief's fonts sets it: `ui`, `display` or `mono`.
- `weight`: a weight that font ships.
- `case`: as written, upper or lower.
- `letterSpacing`: tight, normal, wide or wider.

Each mode's `logo` color is part of its colors, below.

## Colors

Choose the colors for the mood the page should put people in when they see it, the one the brief's personality and feel name: calm and focused, warm and friendly, bold and energetic. The background, the brand and the frame set it first, before anyone reads a word.

Code builds a ramp of twelve steps for each set from the brief: the brand's (`theme`) from `seedHue` and `seedChroma`, the `base` from `baseHue` and `baseChroma`, the frame's from `frameHue` and `frameChroma`, each colored entity's from its hue, and each status's from its hue in `statusHues`. Step 1 is the lightest in light mode and the darkest in dark mode, and step 12 is the other end, so a step plays the same part in both modes: backgrounds take low steps and text high ones. For each role, pick the step of its set's ramp that suits it.

{{steps}}

`colors` holds each mode the brief's `colorScheme` names, once: light, dark, or both. Each mode has:

- `mode`: light or dark.
- `background`: the page background, as one CSS background value.
  - It is not limited to one flat color. Choose whatever the feel needs: a flat tint, a gradient, or a pattern drawn with repeating gradients.
  - A gradient or a pattern must show, as the checks below say. For a calm page, use a flat tint.
  - Use colors and gradients only. The app ships no image files.
  - Page text sits on every color in it, so keep each of them readable under `pageFg`.
  - In an app with both modes, each mode has its own: the same idea in that mode's colors.
- `theme`: the brand's set, from the theme ramp, for primary actions, links, selections and focus. Its twelve roles:
  - `bg`: the subtle background of brand containers. `hoverBg`: that background on hover, also the selected fill.
  - `fg`: text and icons on `bg` and `hoverBg`. `fgMuted`: supporting text on `bg`.
  - `border`: the boundary of brand controls and containers.
  - `accentBg`: the filled brand color, such as a primary button. `accentHoverBg`: it on hover. `accentBorder`: its boundary.
  - `accentFg`: text and icons on `accentBg` and `accentHoverBg`.
  - `focus`: the focus ring on regular controls. `accentFocus`: the focus ring on filled ones. With a halo focus ring, put `accentFocus` on another step than `accentBg`: a halo draws its line just inside the control's edge, so a ring in the fill's own color does not show.
  - `shadow`: the shadow color, the darkest step in either mode.
- `base`: the set most components use: secondary and ghost buttons, inputs, cards, tables, menus, tabs, tags, dialogs and popovers. The same twelve roles, from the base ramp; its `accentBg` is the strong neutral fill, such as a dark button in light mode. Most of what users see is this set, so it carries the brief's feel as much as the brand does.
- `page`: the page's colors. Each is a `ramp` (base or theme) and a `step` of it, except `frameBg`.
  - `pageBg`: the page's solid color. It sits behind the background, and disabled controls fade into it. Pick the step closest to the background's main color.
  - `pageFg` and `pageFgMuted`: the text on the page and on the frame.
  - `frameBg`: the background of the header, sidebar and footer. It is a `step` of the frame ramp.
  - `divider`: the hairline between rows and sections. Quiet, but visible on `pageBg`, `frameBg` and every color of the page background.
  - `skeleton`: the placeholder shapes while content loads. Visible on `pageBg`, `frameBg` and the base set's `bg`.
  - `backdrop`: the color laid over the page behind a dialog or drawer. Darker than the page and the frame. Components set its opacity.
- `logo`: the wordmark's color, a `ramp` (base or theme) and a `step`. It sits on `frameBg`, and on the page under an overlay header, so it reads on both.
- `status`: a set for each of `success`, `warning`, `error` and `info`, with the same twelve roles, from its own ramp. Toasts, alerts, badges and field errors wear them, so each reads as its meaning and sits well in this theme's mood.
- `entities`: a set for each colored entity of the brief: its `noun`, and the same twelve roles as `steps` of its own ramp. [] when no entity is colored.

A border can be any step of its set's ramp. It does not have to be a shade near its background. For example, a dark button with a bright border is a valid look: a dark step for `accentBg` and a bright step for `accentBorder`. Pick each border for the look the brief asks for.

Code checks these contrasts:

- 4.5:1 for `fg` and `fgMuted` on `bg`, `fg` on `hoverBg`, and `accentFg` on `accentBg` and `accentHoverBg`, in every set, the status sets included.
- 4.5:1 for `pageFg` and `pageFgMuted` on `pageBg`, on `frameBg` and on every color of the page background.
- 4.5:1 for the theme's and base's `fg` on `pageBg` and `frameBg`, where links sit.
- 3:1 for `border` and `focus` on `bg`, and for the theme's and base's `border` and `focus` on `pageBg` and `frameBg`.
- 3:1 for the `logo` on `frameBg` and `pageBg`.
- 1.1:1 between the lightest and darkest colors of a page background that has more than one color.
- 1.1:1 for `divider` on `pageBg`, `frameBg` and every color of the page background, and for `skeleton` on `pageBg`, `frameBg` and the base set's `bg`. A `backdrop` darker than the page and the frame.

Keep the brand and entity colors clearly apart from the status colors.

## Page layouts

Write an `app` layout for the task pages and a `marketing` layout for public pages such as the landing page. Every page of a kind sits in its layout's frame.

- `docksFirst`, in the app layout: with header, the header and the footer span the full width and the sidebar runs between them; with sidebars, the sidebar runs the full height.
- `header`: needed or not; what sits at its start, center and end, such as the wordmark, the account menu, and the navigation or the search when the flows have them; its height; whether it stays in view while the page scrolls; and `overlay` to lie over the first section, such as a light header on a landing page's hero.
- `sidebar`, in the app layout: needed or not; left or right; what sits at the top and the bottom; the width; whether it stays in view. The marketing layout has no sidebar.
- `footer`: needed or not; what sits at its start, center and end; its height, or 0 to fit its content.
- Each part has a padding and a gap as spacing token keys, where 4 means 16px, and a `separation`: the frame background, a divider line, a shadow, or none. A part's padding is never smaller than its gap. A header or footer with a height other than 0 is at least as tall as a button of the default size plus the part's padding above and below it.
- `main`: the content area. A fluid container fills the space the frame leaves; a fixed one stops at `maxWidthPx`. `padding` is the page padding, `sectionGap` the gap between sections: 24 to 32 on app pages (6 to 8), 24 to 48 on marketing pages (6 to 12), tighter for compact density and roomier for spacious; the padding is at least the section gap. `align` is start or center. `separation` sets the content area off from the frame, as the parts do: its own panel background, a border, a shadow, or none, such as a bordered panel inset between a tinted header and sidebar. A page can narrow its column inside the container, never widen it.

Frame this app, not a template: a tool used all day may want a sidebar, a small app a top bar, a landing page a header over its hero. Say what sits in a slot in a few words; a later step fills it with components. A slot names only what the scope and the flows give the user, or what every frame has: the wordmark, the account, the way around. Nothing else exists, so help, search or settings with no flow behind them are out. A part that is not needed still gets every field, with "" for its slots and 0 for its sizes.

## Component defaults

For every component in `defaults`, pick the variant values and the look the app uses unless a page says otherwise, from that component's own values. Choose them for the brief's feel and density, such as ghost buttons and rounded chips for a soft, minimal app, or outlined cards for a dense tool. Keep the defaults that carry meaning as the design system sets them: a status, a danger or status variant, an icon-only size, and a dialog's size. A default never undoes another choice of the theme: no rounded or pill look with a sharp radius or a squared feel, no small size with a spacious density, and no `plain` look on links app-wide, since it hides every link.

The app is built from this design system:

{{dsProse}}
