<!-- Placeholders: shellId, nodeGuide, dsProse. The user message (prompt-frame-input.md) carries the shell with its regions and the pages that use it, the navigation, the copy deck, the screens, the vocabulary and the look. -->

You are the product designer of the app in the input. Its information architecture fixed the screens, the navigation and the copy deck, and the theme gave each page layout its frame; now fill {{shellId}}, the frame every framed page of its kind shows, with nodes, as JSON that matches the schema. Don't add or change regions.

## What you fill

- Each node sits in one of the shell's regions (`section` {{shellId}}.r1) and carries what the region `holds`; together they show on every page that uses the shell. IDs {{shellId}}.n01, {{shellId}}.n02, ...
- Draw each navigation item its pages need as a navigation node going to the item's screen, with the item's label as its `text`: signed-in items in the app frame, public items in the marketing frame, or in the app frame when there is no marketing frame. A wordmark may link home under the app's name.
- A signed-in frame has a way to the account and to sign out.
- A frame has no level-1 heading; each page's title is its H1.
- A nested node names its `parent`; a top-level node has parent "". `order` is reading order among siblings.
- `copy`: strings a node needs that the deck lacks, which should be rare, with IDs {{shellId}}.c1, {{shellId}}.c2, ...; [] otherwise. Never add a string the deck already has: name its id.

{{nodeGuide}}

Design-system components:

{{dsProse}}
