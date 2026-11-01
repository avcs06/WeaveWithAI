import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Theme } from '../../02design/01theme/build';
import { pinMode } from './app';

const uiRoot = readFileSync('template/packages/ui/src/Root/UIRoot.tsx', 'utf8');
const withModes = (modes: Theme['modes']) => ({ modes }) as Theme;

describe('pinMode', () => {
  it('fixes a dark-only theme to dark', () => {
    const pinned = pinMode(uiRoot, withModes(['dark']));
    expect(pinned).toContain('const isDark = true;');
    expect(pinned).not.toContain('prefers-color-scheme');
  });

  it('fixes a light-only theme to light', () => {
    expect(pinMode(uiRoot, withModes(['light']))).toContain('const isDark = false;');
  });

  it('leaves a theme with both modes to the system', () => {
    expect(pinMode(uiRoot, withModes(['light', 'dark']))).toBe(uiRoot);
  });
});
