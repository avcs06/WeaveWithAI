import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { loadEnv } from './env';

const dir = mkdtempSync(path.join(tmpdir(), 'weave-'));
// A path that never exists, so a case does not pick up the repo's own .env.
const missing = path.join(dir, 'missing.env');

describe('loadEnv', () => {
  // loadEnvFile never overrides a key already in process.env.
  beforeEach(() => {
    delete process.env.MODEL_API_KEY;
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('reads the key from a .env file and fills the defaults', () => {
    const file = path.join(dir, '.env');
    writeFileSync(file, 'MODEL_API_KEY=k1\n');
    expect(loadEnv({ file })).toMatchObject({
      MODEL_API_KEY: 'k1',
      LLM_MODEL: 'muse-spark-1.3',
      LLM_REPLAY: true,
    });
  });

  it('throws naming MODEL_API_KEY when there is no file and no key', () => {
    expect(() => loadEnv({ file: missing })).toThrow(/MODEL_API_KEY/);
  });

  it('reads LLM_REPLAY=false as false', () => {
    const env = { MODEL_API_KEY: 'k', LLM_REPLAY: 'false' };
    expect(loadEnv({ file: missing, env }).LLM_REPLAY).toBe(false);
  });

  it('throws naming LLM_BASE_URL when it is not a URL', () => {
    const env = { MODEL_API_KEY: 'k', LLM_BASE_URL: 'not a url' };
    expect(() => loadEnv({ file: missing, env })).toThrow(/LLM_BASE_URL/);
  });
});
