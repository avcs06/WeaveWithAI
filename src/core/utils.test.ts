import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  canonicalJson,
  hashOf,
  keysOf,
  pathBeside,
  writeJsonAtomic,
} from './utils';

const dir = mkdtempSync(path.join(tmpdir(), 'weave-utils-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('canonicalJson and hashOf', () => {
  it('ignore key order at every level and nothing else', () => {
    expect(canonicalJson({ b: 1, a: [{ z: 0, y: 1 }] })).toBe(
      '{"a":[{"y":1,"z":0}],"b":1}',
    );
    expect(hashOf({ a: 1, b: [1, { c: 2, d: 3 }] })).toBe(
      hashOf({ b: [1, { d: 3, c: 2 }], a: 1 }),
    );
    expect(hashOf({ a: 1 })).not.toBe(hashOf({ a: 2 }));
  });
});

describe('writeJsonAtomic', () => {
  it('creates the folder, writes pretty JSON and leaves no temp file', () => {
    const file = path.join(dir, 'deep', 'state.json');
    writeJsonAtomic(file, { ok: true });
    expect(readFileSync(file, 'utf8')).toBe('{\n  "ok": true\n}\n');
    expect(existsSync(`${file}.tmp`)).toBe(false);
  });
});

describe('pathBeside and keysOf', () => {
  it('resolve next to the module and walk every key', () => {
    expect(pathBeside(import.meta.url, './utils.ts')).toBe(
      path.join(import.meta.dirname, 'utils.ts'),
    );
    expect(keysOf({ a: [{ b: 1 }], c: { d: null } })).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });
});
