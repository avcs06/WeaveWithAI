import { describe, expect, it } from 'vitest';
import { SUMMARY_HEAD } from '../../engine/compose';
import { uxScopes } from './scopes';

const block = (file: string, ...lines: string[]) =>
  [`diff --git a/${file} b/${file}`, '--- a/x', `+++ b/${file}`, ...lines.map((line) => `+${line}`), ''].join('\n');
const routes = 'web/app/(routes)/(marketing)';
const diff = [
  block(`${routes}/page.tsx`, "import { PieceCards } from '@app/blocks/pieces';"),
  block(`${routes}/shop/page.tsx`, 'export default function Shop() {}'),
  block(`${routes}/shop/[pieceId]/page.tsx`, "import { Gallery } from './components/Gallery';"),
  block(`${routes}/shop/[pieceId]/components/Gallery.tsx`, 'export const Gallery = () => null;'),
  block('web/app/blocks/pieces/PieceCards.tsx', "import { Price } from '../money';"),
  block('web/app/blocks/money/Price.tsx', 'export const Price = () => null;'),
  block('web/app/blocks/orders/OrderItems.tsx', 'export const OrderItems = () => null;'),
  block(`${routes}/cart/page.tsx`, 'export default function Cart() {}'),
].join('');
const raw = `${diff}\n\n${SUMMARY_HEAD}Built the shop.`;
const screens = [
  { id: 'S01', folder: routes },
  { id: 'S02', folder: `${routes}/shop` },
  { id: 'S03', folder: `${routes}/shop/[pieceId]` },
  { id: 'S04', folder: `${routes}/cart` },
];
const files = ['S01', 'S02', 'S03', 'S04', 'S08', 'guidelines'].map((name) => ({ path: `04-pages/${name}.md`, text: `${name} text` }));
const shot = (screen: string) => ({ label: `The screenshot of ${screen}:`, file: `/shots/${screen}.png`, screen });
const shots = ['S01', 'S02', 'S03', 'S04'].map(shot);
const filesIn = (output = '') => [...output.matchAll(/^diff --git a\/(\S+) /gm)].map((match) => match[1]);

describe('the UX scopes', () => {
  it('give each three screens their design but no other screen\'s, their own files and the blocks they import, the summary and their screenshots', () => {
    const [first, second, ...rest] = uxScopes(screens, files, raw, shots);
    expect(rest).toEqual([]);
    expect(first?.user).toBe('## .weave/04-pages/S01.md\n\nS01 text\n\n## .weave/04-pages/S02.md\n\nS02 text\n\n## .weave/04-pages/S03.md\n\nS03 text\n\n## .weave/04-pages/guidelines.md\n\nguidelines text');
    // A route folder holds its own files and components, never the screens in the folders inside it.
    expect(filesIn(first?.output)).toEqual([
      `${routes}/page.tsx`,
      `${routes}/shop/page.tsx`,
      `${routes}/shop/[pieceId]/page.tsx`,
      `${routes}/shop/[pieceId]/components/Gallery.tsx`,
      'web/app/blocks/pieces/PieceCards.tsx',
      'web/app/blocks/money/Price.tsx',
    ]);
    expect(first?.output?.endsWith(`\n\n${SUMMARY_HEAD}Built the shop.`)).toBe(true);
    expect(first?.images).toEqual([shot('S01'), shot('S02'), shot('S03')]);
    expect(filesIn(second?.output)).toEqual([`${routes}/cart/page.tsx`]);
    expect(second?.user).not.toContain('S01 text');
    expect(second?.images).toEqual([shot('S04')]);
  });

  it('give a unit with no screens of its own, such as the frames, one call over the whole with every screenshot, and none without', () => {
    expect(uxScopes([], files, raw, shots)).toEqual([{ images: shots }]);
    expect(uxScopes([], files, raw, [])).toEqual([]);
  });
});
