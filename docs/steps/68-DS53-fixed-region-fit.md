# 68 · DS53 A fixed-height region fits what the frame puts in it

Phase 3 · 65 min · Depends: DS42 · Decisions: D3.3 F · Spec: specs/design.md rule table (THEME-006, LAYOUT-071)

## Goal

A header or footer of fixed height holds its nodes inside its padding. The
calls that choose the sizes see the clash in their own rounds, instead of
assemble finding it once.

## Why

LAYOUT-071 stayed known in every run of 2026-11-01:

| Run | Region | Height, padding, room inside | Too tall |
|---|---|---|---|
| dashboard 20261101-0107 | SH1.r1 | 64, 16, 32 | SH1.n05, 40 |
| ecommerce 20261101-0150 | SH1.r1 | 64, 16, 32 | SH1.n06, 40 |
| freelancer 20261101-0150 | SH1.r2 | 64, 16, 32 | SH1.n15, 80; SH1.n16, 40 |

Assemble sends it to the frame (DS37), and that one fix call solved it in
no run. Two causes:

- THEME-006 sizes a fixed bar for the smallest button (32), but frames
  place the theme's default size (md, 40).
- A frame puts a field with a visible label (a FormControl, 80 tall) in a
  header.

The frame call never runs the layout rules in its own rounds, so it never
sees the clash.

## What this step does

1. **THEME-006**: a fixed bar fits the theme's default Button size
   (`defaults.Button.size`, else md) and its padding. This changes what the
   theme writes: a taller bar, or less padding.
2. **The frame prompt**: a node in a region of fixed height fits inside its
   padding. Use a control at size sm when the default does not fit, a search
   field without a visible label, and text as a Truncate. The input already
   gives each region's height and padding.
3. **The frame checks**: LAYOUT-071 runs on the shell alone in the frame
   call's rounds. Solve the shell around an empty page, as `widgetPage`
   does for a widget. Assemble keeps it as the net.

Items 1 and 2 take about 20 minutes; item 3 about 45.

## Tests

- THEME-006: a 64 tall header with padding 16 fails when the default
  Button is md (40), and passes at 72.
- The frame checks: a 40 tall button in a 64 tall header with padding 16
  fails LAYOUT-071 in the frame's own checks.

## Done when

```sh
pnpm typecheck
pnpm test
```

## Watch out

- The reading-list theme fixture fails the new THEME-006: its app header is
  56 tall with padding 12 and its marketing header 64 with padding 16,
  while its default Button is md. Raise both headers to 72 in the fixture:
  that meets a stricter rule and weakens nothing.
