import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fixedBoxes } from './measure-design-system.mjs';

const reading = (name, content, root, parts = {}) => ({
  name,
  content,
  missing: false,
  root,
  parts,
});

test('keeps a dimension equal in both renderings and drops one that moved', () => {
  const { boxes, errors } = fixedBoxes([
    reading('Button/sm', 'short', { width: 61.5, height: 32 }),
    reading('Button/sm', 'long', { width: 160.2, height: 32.4 }),
    reading('Avatar/md', 'short', { width: 36, height: 36 }),
    reading('Avatar/md', 'long', { width: 36, height: 36 }),
    reading('Card', 'short', { width: 480, height: 80 }),
    reading('Card', 'long', { width: 720, height: 200 }),
    reading('Empty', 'short', { width: 8, height: 0 }),
    reading('Empty', 'long', { width: 8, height: 0 }),
  ]);
  assert.deepEqual(boxes, {
    'Button/sm': { height: 32 },
    'Avatar/md': { height: 36, width: 36 },
    Empty: { width: 8 },
  });
  assert.deepEqual(errors, []);
});

test('names a part under its case and skips a root marked off', () => {
  const { boxes } = fixedBoxes([
    reading('Dialog/md', 'short', { width: 520, height: 300 }, { header: { width: 520, height: 60 } }),
    reading('Dialog/md', 'long', { width: 520, height: 500 }, { header: { width: 520, height: 60 } }),
    reading('Accordion', 'short', null, { trigger: { width: 480, height: 44 } }),
    reading('Accordion', 'long', null, { trigger: { width: 720, height: 44 } }),
  ]);
  assert.deepEqual(boxes, {
    'Dialog/md': { width: 520 },
    'Dialog/md/header': { height: 60, width: 520 },
    'Accordion/trigger': { height: 44 },
  });
});

test('keeps padding and gap equal in both renderings, and only when not zero', () => {
  const spaced = (width, height, padding, gap) => ({ width, height, padding, gap });
  const { boxes } = fixedBoxes([
    reading('Card', 'short', spaced(480, 80, [16, 20, 16, 20], 12)),
    reading('Card', 'long', spaced(720, 200, [16, 20, 16, 20], 12)),
    reading('Button/sm', 'short', spaced(60, 32, [6, 8, 6, 8], 8), { icon: spaced(16, 16, [0, 0, 0, 0], 0) }),
    reading('Button/sm', 'long', spaced(160, 32, [6, 8, 6, 8], 8), { icon: spaced(16, 16, [0, 0, 0, 0], 0) }),
    reading('Moving', 'short', spaced(480, 80, [8, 8, 8, 8], 4)),
    reading('Moving', 'long', spaced(720, 200, [12, 8, 8, 8], 6)),
  ]);
  assert.deepEqual(boxes, {
    Card: { padding: [16, 20, 16, 20], gap: 12 },
    'Button/sm': { height: 32, padding: [6, 8, 6, 8], gap: 8 },
    'Button/sm/icon': { height: 16, width: 16 },
  });
});

test('records a declared minimum height, for a part or the root, unless it is the fixed height', () => {
  const box = (height, width) => ({ width, height });
  const { boxes, errors } = fixedBoxes([
    { ...reading('MultiSelect/sm', 'short', null, { box: box(32, 300) }), mins: { box: box(32, 300) } },
    { ...reading('MultiSelect/sm', 'long', null, { box: box(64, 500) }), mins: { box: box(32, 500) } },
    { ...reading('Select/sm', 'short', null, { box: box(32, 300) }), mins: { box: box(32, 300) } },
    { ...reading('Select/sm', 'long', null, { box: box(32, 500) }), mins: { box: box(32, 500) } },
    { ...reading('Textarea/sm', 'short', null, { box: box(96, 300) }), mins: { box: box(32, 300) } },
    { ...reading('Textarea/sm', 'long', null, { box: box(96, 500) }), mins: { box: box(32, 500) } },
    { ...reading('Card', 'short', box(80, 300)), mins: { root: null } },
    { ...reading('Card', 'long', box(200, 500)), mins: { root: null } },
    { ...reading('Panel', 'short', box(80, 300)), mins: { root: box(48, 300) } },
    { ...reading('Panel', 'long', box(200, 500)), mins: { root: box(48, 500) } },
  ]);
  assert.deepEqual(boxes, {
    'MultiSelect/sm/box': { minHeight: 32 },
    'Select/sm/box': { height: 32 },
    'Textarea/sm/box': { height: 96, minHeight: 32 },
    Panel: { minHeight: 48 },
  });
  assert.deepEqual(errors, []);
});

test('reports a missing rendering, element or part', () => {
  const { errors } = fixedBoxes([
    reading('Lonely', 'short', { width: 1, height: 1 }),
    { ...reading('Gone', 'short', null), missing: true },
    reading('Gone', 'long', null),
    reading('Tabs', 'short', null, { list: null }),
    reading('Tabs', 'long', null, { list: { width: 1, height: 1 } }),
  ]);
  assert.deepEqual(errors, [
    'Lonely: needs a short and a long rendering',
    'Gone: element not found',
    'Tabs: no part list',
  ]);
});
