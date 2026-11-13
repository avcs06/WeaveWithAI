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
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('reads the key from a .env file and fills the defaults', () => {
    const file = path.join(dir, '.env');
    writeFileSync(file, 'ANTHROPIC_API_KEY=k1\n');
    expect(loadEnv({ file })).toMatchObject({
      ANTHROPIC_API_KEY: 'k1',
      LLM_MODEL: 'claude-sonnet-5-5',
      LLM_MODEL_STRONG: 'claude-opus-5-5',
      LLM_REPLAY: true,
      CLAUDE_BIN: 'claude',
      CLAUDE_DOCKER: true,
      CLAUDE_AUTH: 'api',
    });
  });

  it('treats a blank variable as unset', () => {
    const env = { ANTHROPIC_API_KEY: 'k', LLM_MODEL: '', CLAUDE_CODE_OAUTH_TOKEN: '' };
    const loaded = loadEnv({ file: missing, env });
    expect(loaded.LLM_MODEL).toBe('claude-sonnet-5-5');
    expect(loaded.CLAUDE_CODE_OAUTH_TOKEN).toBeUndefined();
  });

  it('throws naming ANTHROPIC_API_KEY when there is no file and no key', () => {
    expect(() => loadEnv({ file: missing })).toThrow(/ANTHROPIC_API_KEY/);
  });

  it('reads LLM_REPLAY=false as false', () => {
    const env = { ANTHROPIC_API_KEY: 'k', LLM_REPLAY: 'false' };
    expect(loadEnv({ file: missing, env }).LLM_REPLAY).toBe(false);
  });

  it('throws naming CLAUDE_CODE_OAUTH_TOKEN when the subscription has no token', () => {
    const env = { ANTHROPIC_API_KEY: 'k', CLAUDE_AUTH: 'subscription' };
    expect(() => loadEnv({ file: missing, env })).toThrow(/CLAUDE_CODE_OAUTH_TOKEN/);
    expect(loadEnv({ file: missing, env: { ...env, CLAUDE_CODE_OAUTH_TOKEN: 't' } }).CLAUDE_AUTH).toBe('subscription');
  });
});
