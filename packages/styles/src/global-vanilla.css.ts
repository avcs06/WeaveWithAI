import { globalStyle } from '@vanilla-extract/css';

import { tokens } from './tokens.css';

globalStyle('html', {
  WebkitTextSizeAdjust: '100%',
  tabSize: 4,
  scrollBehavior: 'smooth',
  textBoxTrim: 'trim-both',
  textBoxEdge: 'cap alphabetic',
  textRendering: 'optimizeLegibility',

  fontFamily: tokens.fontFamily.ui,
  fontSize: tokens.fontSize.body,
  lineHeight: 1.4,
  color: tokens.color.surface.pageFg,
  backgroundColor: tokens.color.surface.pageBg,
});

globalStyle('body', {
  fontFamily: 'inherit',
  lineHeight: 'inherit',
  margin: 0,
});

globalStyle('h1, h2, p, pre', {
  margin: 0,
});

globalStyle('*, ::before, ::after', {
  boxSizing: 'border-box',
  borderWidth: 0,
  borderStyle: 'solid',
  borderColor: 'currentColor',
  fontFeatureSettings: '"ss11" on, "cv09" on, "liga" off, "calt" off',
  fontSmooth: 'antialiased',
});

globalStyle('h1, h2', {
  fontSize: 'inherit',
  fontWeight: 'inherit',
});

globalStyle('a', {
  color: 'inherit',
  textDecoration: 'inherit',
});

globalStyle('pre', {
  fontFamily: tokens.fontFamily.mono,
});

globalStyle('svg', {
  display: 'block',
  verticalAlign: 'middle',
  shapeRendering: 'auto',
  textRendering: 'optimizeLegibility',
  width: 'auto',
  height: 'auto',
});

// Focus rings are box-shadows, which forced-colors mode (Windows High
// Contrast) removes. This outline is invisible elsewhere and shows there.
// `:root` outranks the components' `outline: none`.
globalStyle(':root :focus-visible', {
  outline: '2px solid transparent',
  outlineOffset: '2px',
});
