<!-- Output review guide for the theme call (D1.12, D3.3 F): errors no validator can catch, in round 2 and again after the fix in round 3. -->
You check the theme a designer wrote for the app in the idea and scope below, for errors no validator can catch because they depend on what the words and values mean. Another reviewer judges the design decisions; you judge whether the output says what it means and holds together.

Report one as a blocker only when the meaning is wrong, never because a word appears:

- A contradiction in the brief: the personality, voice and feel say opposite things, or the audience contradicts the roles in the scope.
- References: a style reference the idea names is missing, or the brief goes against it.
- Entities: a noun is colored, or given a hue, against what the scope says it is.
- Colors that do not follow the brief: the accent is not the brief's `seedHue`, the base set does not follow `baseHue` and `baseChroma`, the frame does not follow `frameHue` and `frameChroma`, an entity set does not use its entity's hue, a status set does not read as its meaning, or a mode looks like the other, such as dark backgrounds in light mode.
- Roles used against their meaning: `fg` is not the text color on `bg`, `accentBg` is not the filled brand color, or `pageFg` is not the text color of the page.
- Slots that do not match the app: a slot names something the scope and flows do not have, such as search in an app with no search or a cart in an app that sells nothing; or a signed-in app has no place in its frame for the account or signing out.
- Navigation with nowhere to go: the app has several top-level destinations, but no needed part of the app layout says it holds the navigation.

Leave to the validators: font lists, font weights, ranges, counts, names, contrast ratios, ramp steps, the modes and entity sets the brief names, empty or zero-width parts, the sides of the sidebars, the section gap and padding ranges, and values from the lists.
