import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Theme } from '../../02design/01theme/build';
import { PAGE_LOGO, pinMode, ROOT_LAYOUT, setLogoName, setTitle } from './app';

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

describe('setTitle', () => {
  const layout = readFileSync(`template/${ROOT_LAYOUT}`, 'utf8');

  it("gives every page the app's name as its title, once, before the layout", () => {
    const titled = setTitle(layout, "Ana's Studio");
    expect(titled).toContain("export const metadata = { title: 'Ana\\'s Studio' };\n\nexport default function RootLayout");
    expect(setTitle(titled, 'NeonBoard').match(/export const metadata/g)).toHaveLength(1);
    expect(setTitle(titled, 'NeonBoard')).toContain("{ title: 'NeonBoard' }");
  });
});

describe('setLogoName', () => {
  const logo = readFileSync(`template/${PAGE_LOGO}`, 'utf8');

  it("writes the app's name into PageLogo, over the last one", () => {
    const named = setLogoName(logo, "Ana's Studio");
    expect(named).toContain("const APP_NAME = 'Ana\\'s Studio';");
    expect(setLogoName(named, 'NeonBoard')).toContain("const APP_NAME = 'NeonBoard';");
    expect(setLogoName(named, 'NeonBoard').match(/const APP_NAME/g)).toHaveLength(1);
  });
});
