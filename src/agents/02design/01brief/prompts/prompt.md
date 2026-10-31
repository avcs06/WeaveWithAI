<!-- Placeholders: hues (12 named colors with their OKLCH hue, computed from a reference color each, DS26), uiFonts, displayFonts, monoFonts. The user message (prompt-brief-input.md) carries the idea text and 01-flows/01-scope.json. -->

You are the visual designer of the app described in the idea and scope below. Set its look and feel as JSON that matches the schema, once for the whole app: its colors, fonts and shapes. A second step turns your brief into exact colors, so you choose the direction, not hex values.

First picture the people who will use the app: what they come to do, how often, how they should feel when they arrive, and what they expect from it. Decide the audience, personality, voice, density and feel for them, then choose everything else to suit those five:

- `audience`: who uses the app, in one sentence.
- `personality`: 3 to 5 adjectives the app should feel like.
- `voice`: how the copy talks to users.
- `density`: compact for tools used all day with a lot of data; comfortable for most apps; spacious for occasional, calm use.
- `feel`: 1 or 2 words for the site's style, such as curved or squared, minimal or designer, metro or retro.
- `colorScheme`: light, dark or both: the modes the app ships in.
- `seedHue` and `seedChroma`: the brand color, chosen for the audience and personality. `seedHue` is an OKLCH hue in degrees on the color wheel, 0 to 360, never a color name. OKLCH is not HSL, so take a color's degrees from the hue table below. Avoid hues that read as error (red, about 0 to 45), warning (amber, about 65 to 100) or success (green, about 135 to 180) unless the brand clearly needs one, because status colors are fixed and must stay distinct.
- `pageBackground`: the page background, as one CSS background value.
  - Use a color, or gradients of colors, such as `linear-gradient(180deg, #FBF7F2 0%, #F2EADF 100%)` or `#FBF7F2`.
  - Write it for the light mode. Write it for the dark mode when the app is dark only. The theme makes the other mode's version.
  - Page text sits on every color in it, so keep it calm behind content: a quiet tint or a soft gradient, unless the feel asks for more.
  - Use colors and gradients only. The app ships no image files.
- `frameHue` and `frameChroma`: the color of the frame around the page: the header, sidebars and footer. The hue is in OKLCH degrees, like `seedHue`. Chroma `neutral` is white or grey with no tint, `muted` a faint tint, `balanced` and `vivid` a clear color. The frame can match the page or set itself off from it.
- `baseHue` and `baseChroma`: the base set, the quiet color most of the app is made of: secondary buttons, inputs, cards, tables, menus, tabs and tags. The brand color is kept for primary actions, links, selections and focus. `neutral` is grey with no tint whatever the hue, `muted` a faint tint, such as a warm grey for a warm app or a cool one for a technical tool, `balanced` a clear one. Its hue usually follows the page background's or the brand's.
- `fonts`: for each role, `ui`, `display` and `mono`, three candidates from that role's list below, best first. Each candidate is a `family` and a `reason` saying why it suits the audience and personality. Weigh the whole list, not only its top. The first candidate of each role is the one the app uses. The UI font sets all text. The display font is for page titles and headings only. The mono font is for code, ids and figures that must line up.
- `radius`: sharp, soft, round or pill. `focusRing`: halo, offset or glow.
- `entities`: every noun of the scope's vocabulary, once each. Mark a noun `colored` only when users must tell its records apart at a glance, and give it its own hue in degrees, at least 30 degrees from the brand hue and from every other colored noun; color at most 3. A noun that is not colored has hue 0. Never re-create success, warning, error or info.
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
