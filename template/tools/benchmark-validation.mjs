import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { Linter } from 'eslint';
import plugin, {
  tailwindEquivalents,
} from './eslint/tailwind-layout-plugin.mjs';
import {
  equivalentCandidates,
  indexEquivalents,
  matchesCssValue,
} from './eslint/tailwind-equivalents.mjs';

const index = indexEquivalents(tailwindEquivalents);
const values = new Map(
  Object.entries({
    width: '100%',
    display: 'flex',
    padding: '16px',
    color: 'red',
  }).map(([key, value]) => [key, { value }]),
);
const scan = () =>
  tailwindEquivalents
    .filter(({ declarations }) =>
      Object.entries(declarations).every(([key, expected]) =>
        matchesCssValue(key, values.get(key)?.value, expected),
      ),
    )
    .map(({ className }) => className);
const indexed = () =>
  equivalentCandidates(index, values)
    .filter(({ entries }) =>
      entries.every(([key, expected]) =>
        matchesCssValue(key, values.get(key)?.value, expected),
      ),
    )
    .map(({ className }) => className);
assert.deepEqual(indexed(), scan());

function measure(name, action, iterations) {
  for (let i = 0; i < 10; i++) action();
  const samples = [];
  for (let sample = 0; sample < 5; sample++) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) action();
    samples.push((performance.now() - start) / iterations);
  }
  console.log(
    `${name}: median ${samples.sort((a, b) => a - b)[2].toFixed(4)} ms/operation`,
  );
}

measure('Original full utility scan', scan, 10000);
measure('Indexed utility matching', indexed, 10000);
const linter = new Linter();
const config = [
  { plugins: { layout: plugin }, rules: { 'layout/prefer-tailwind': 'error' } },
];
const code =
  "import {style} from '@vanilla-extract/css';" +
  Array.from(
    { length: 300 },
    (_, i) =>
      `const s${i}=style({width:'100%',display:'flex',padding:'16px',color:'red'});`,
  ).join('\n');
measure(
  'ESLint: 300 style objects (including parsing)',
  () => linter.verify(code, config),
  15,
);
if (global.gc) {
  global.gc();
  const before = process.memoryUsage().heapUsed;
  for (let i = 0; i < 100; i++) linter.verify(code, config);
  global.gc();
  console.log(
    `Retained heap change after 100 lint runs: ${((process.memoryUsage().heapUsed - before) / 1048576).toFixed(2)} MiB`,
  );
}
