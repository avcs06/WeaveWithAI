import { extendTailwindMerge } from 'tailwind-merge';

import { tokens } from './tokens.css';

const spacingClassParts = Object.keys(tokens.spacing);
const fontSizeClassParts = Object.keys(tokens.fontSize);
const zIndexClassParts = Object.keys(tokens.zIndex);
const iconSizeClassParts = Object.keys(tokens.iconSize);

const spacingPairs = spacingClassParts.flatMap((first) =>
  spacingClassParts.map((second) => `${first}-${second}`),
);
const minBounds = ['0', 'full', 'screen'];
const maxBounds = ['0', 'none', 'full', 'screen'];
const boundPairs = minBounds.flatMap((minimum) =>
  maxBounds.map((maximum) => `${minimum}-${maximum}`),
);

type CompoundClassGroup =
  | 'icon-size'
  | 'flex-layout'
  | 'flex-fill'
  | 'compound-p'
  | 'compound-px'
  | 'compound-py'
  | 'compound-m'
  | 'compound-mx'
  | 'compound-my'
  | 'w-minmax'
  | 'h-minmax';

export const classNames = extendTailwindMerge<CompoundClassGroup>({
  override: {
    classGroups: {
      // Only the preset's font sizes: tailwind-merge's default also treats
      // `text-base` as a size, but here it's the base set's text color.
      'font-size': [{ text: fontSizeClassParts }],
    },
  },
  extend: {
    theme: {
      spacing: spacingClassParts,
    },
    classGroups: {
      z: [{ z: zIndexClassParts }],
      'icon-size': [{ 'icon-size': iconSizeClassParts }],
      'flex-layout': [
        { 'flex-row-gap': spacingClassParts },
        { 'flex-col-gap': spacingClassParts },
        { 'inline-flex-row-gap': spacingClassParts },
        { 'inline-flex-col-gap': spacingClassParts },
      ],
      'flex-fill': ['flex-fill-x', 'flex-fill-y'],
      'compound-p': [{ p: spacingPairs }],
      'compound-px': [{ px: spacingPairs }],
      'compound-py': [{ py: spacingPairs }],
      'compound-m': [{ m: spacingPairs }],
      'compound-mx': [{ mx: spacingPairs }],
      'compound-my': [{ my: spacingPairs }],
      'w-minmax': [{ 'w-minmax': boundPairs }],
      'h-minmax': [{ 'h-minmax': boundPairs }],
    },
    conflictingClassGroups: {
      'icon-size': ['size', 'w', 'h'],
      size: ['icon-size'],
      w: ['icon-size'],
      h: ['icon-size'],
      'flex-layout': ['display', 'flex-direction', 'gap'],
      display: ['flex-layout'],
      'flex-direction': ['flex-layout'],
      gap: ['flex-layout'],
      'flex-fill': ['flex', 'min-w', 'min-h'],
      flex: ['flex-fill'],
      'compound-p': ['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl'],
      'compound-px': ['px', 'pl', 'pr', 'compound-p'],
      'compound-py': ['py', 'pt', 'pb', 'compound-p'],
      p: ['compound-p'],
      px: ['compound-p', 'compound-px'],
      py: ['compound-p', 'compound-py'],
      pt: ['compound-p', 'compound-py'],
      pr: ['compound-p', 'compound-px'],
      pb: ['compound-p', 'compound-py'],
      pl: ['compound-p', 'compound-px'],
      'compound-m': ['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml'],
      'compound-mx': ['mx', 'ml', 'mr', 'compound-m'],
      'compound-my': ['my', 'mt', 'mb', 'compound-m'],
      m: ['compound-m'],
      mx: ['compound-m', 'compound-mx'],
      my: ['compound-m', 'compound-my'],
      mt: ['compound-m', 'compound-my'],
      mr: ['compound-m', 'compound-mx'],
      mb: ['compound-m', 'compound-my'],
      ml: ['compound-m', 'compound-mx'],
      'w-minmax': ['min-w', 'max-w'],
      'h-minmax': ['min-h', 'max-h'],
      'min-w': ['flex-fill', 'w-minmax'],
      'max-w': ['w-minmax'],
      'min-h': ['flex-fill', 'h-minmax'],
      'max-h': ['h-minmax'],
    },
  },
});
