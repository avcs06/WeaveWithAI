<!-- Output review guide for the theme call: errors in meaning, in round 2 and again after the fixes of rounds 3 and 4. No placeholders: prompts/index.ts fills it with no values, and the runner puts it into src/runner/prompt-review.md as the guide. The answer holds steps of ramps, not hex: code builds each set from the brief's hues, so no set can wear another hue, and this guide checks each step against its role. It leaves to the validators what validation/validation.ts registers: BRIEF-001, BRIEF-002, BRIEF-003, BRIEF-005, BRIEF-007, THEME-001, THEME-002 and THEME-004 to THEME-012. The halo check on `accentFocus` comes from the template, not the writer prompt (template/packages/styles/src/utils.ts and focusRing.css.ts): every ring is a 1px inset line in its color, halo adds only a faint outline, and offset and glow draw on the page. -->

You check the theme a designer wrote for the app in the idea and scope below, for errors in meaning. Code builds each set's colors from the brief's hues, and checks the contrasts, counts and ranges. You check what depends on what the words and values mean. Later designers draw every screen in this look, a later step fills each slot of the frame with components, and engineers build the app with these values. Another reviewer judges the design decisions; you judge whether the output says what it means, holds together and matches the idea, the scope and the flows.

The sets and the page colors are steps of ramps, 1 to 12. Step 1 is the lightest in light mode and the darkest in dark mode, so in both modes backgrounds take low steps and text high ones. Hues are OKLCH degrees: read them on the hue table in the writer's instructions.

Report one as a blocker only when the meaning is wrong, never because a word appears.

## The brief

- A brief that says opposite things: the personality, voice, density and feel contradict each other, such as a calm, quiet personality with a loud, punchy voice.
- An audience that contradicts the scope's audience or roles, or leaves out a main role, such as the sellers of a marketplace, so the look serves only some of the people who use the app.
- A style reference the idea names that is missing from `references`, or a reference the idea does not name.
- A choice against what the idea asks for about the look, such as a light-only color scheme for an idea that asks for dark mode.
- A hue that is not the color the idea names, read on the hue table, such as a `seedHue` of 30 for an orange brand: 30 is red, and orange is 53.
- Fonts out of order: a first candidate whose reason calls it a second choice, or a later candidate whose reason makes it the better fit. The first candidate of each role is the one the app uses.

## The logo

- A page layout whose needed parts have no slot for the wordmark. Every frame shows it.
- A slot that names a logo image or mark instead of the wordmark. The app ships no image files, so the logo is type alone.

## Colors

- A set whose backgrounds and text are swapped: `bg` or `hoverBg` on a high step and `fg` on a low one, so the subtle background is the strongest color. Every set counts: the brand's, the base, each status and each entity.
- A page whose background and text are swapped: `pageBg` on a high step and `pageFg` on a low one, so the light mode is dark or the dark mode is light.
- An `accentBg` on one of the lowest steps, close to the page, so a primary button, or the base set's strong neutral fill, does not read as filled.
- A `hoverBg` on the same step as `bg`, so hover and selection do not show on a filled item. `hoverBg` is also the selected fill.
- An `accentHoverBg` on the same step as `accentBg`, so hovering a primary button changes nothing.
- Muted text on a higher step than the text it supports, such as `fgMuted` on 12 and `fg` on 11, or `pageFgMuted` above `pageFg`. A higher step is stronger text.
- With a halo focus ring, an `accentFocus` on the same step as `accentBg`, so the ring around a filled control does not show. Offset and glow rings draw on the page around the control.
- A `divider` on a step as strong as text, though it is the quiet hairline between rows.
- A `pageBg` far from the main color of the background, such as a mid grey under a light gradient. It is the page's solid color, and disabled controls fade into it.
- In an app with both modes, a background that is not the same idea in each mode, such as a soft gradient in light mode and a flat grey in dark mode.

A border far from its background is not a blocker. A border can be any step of its ramp, such as a bright border on a dark button.

## Page layouts

- A slot that names something the scope and flows do not have, such as search in an app with no search, a cart in an app that sells nothing, or an account menu where no role signs in.
- A slot that holds what belongs on one screen, such as a form or a record's details. Every page of the frame shows its slots, and later calls design the screens.
- An app with several top-level destinations whose app layout has no needed part that holds the navigation.
- A signed-in app with no place in the app layout for the account or signing out.
- A part that is not needed but holds something no needed part holds, such as the only navigation in a sidebar that is not needed. A part that is not needed is not shown, so what it holds is lost.

Leave out taste.

Leave to the validators, which check:

- The brief's counts and ranges, every vocabulary noun once in the entities, colored hues at least 30 degrees apart, and each status hue inside its band.
- Three different fonts for each role, and a wordmark weight its font ships.
- The contrast of text, of `border` and `focus`, and of the wordmark. Whether the divider, the skeleton and the backdrop show.
- Each mode the color scheme names, once, with one set for each colored noun. A background of colors and gradients only. Each shadow on the darkest step.
- A needed part that holds nothing, a needed sidebar with no width, a header or footer too short for a button, two sidebars on one side, and a fixed container with no width.
- The section gap ranges, and a padding other than 0 that is smaller than the gap inside it.
- The defaults that carry meaning.
