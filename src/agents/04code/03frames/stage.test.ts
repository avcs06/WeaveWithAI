import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { architecture, flows, scope } from '../../02design/__fixtures__/chain';
import { frameProbes, withProbes } from './stage';

describe('frame probes', () => {
  it('put one page in the route group of each frame a screen uses, signed in when that screen is', () => {
    expect(frameProbes(architecture, flows, scope)).toEqual([
      { frame: 'FR01', file: 'web/app/(routes)/(marketing)/weave-frame-marketing/page.tsx', route: '/weave-frame-marketing', signedIn: false },
      { frame: 'FR02', file: 'web/app/(routes)/(app)/weave-frame-app/page.tsx', route: '/weave-frame-app', signedIn: true },
    ]);
  });

  const root = mkdtempSync(path.join(tmpdir(), 'weave-probes-'));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it('are in place while the checks run and gone after, even when a check throws, and leave a folder the app has alone', async () => {
    const probes = frameProbes(architecture, flows, scope);
    const ours = path.join(root, probes[0]!.file);
    // The app already has the second probe's folder: nothing is written to it or removed from it.
    const theirs = path.join(root, probes[1]!.file);
    mkdirSync(path.dirname(theirs), { recursive: true });
    writeFileSync(theirs, 'the app page');

    const seen: string[] = [];
    const check = withProbes(root, probes, async () => {
      seen.push(readFileSync(ours, 'utf8'));
      return [];
    });
    expect(await check()).toEqual([]);
    expect(seen[0]).toContain('<h1 data-ds="">Frame check</h1>');
    expect(existsSync(path.dirname(ours))).toBe(false);
    expect(readFileSync(theirs, 'utf8')).toBe('the app page');

    const failing = withProbes(root, probes, async () => {
      throw new Error('the dev server did not start');
    });
    await expect(failing()).rejects.toThrow('the dev server did not start');
    expect(existsSync(path.dirname(ours))).toBe(false);
    expect(readFileSync(theirs, 'utf8')).toBe('the app page');
  });
});
