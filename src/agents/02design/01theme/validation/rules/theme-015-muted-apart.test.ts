import { describe, expect, it } from 'vitest';
import { runRules } from '../../../../../core/rules';
import { inventory, theme, themeCall } from '../../../__fixtures__/chain';
import { buildTheme } from '../../build';
import { rule } from './theme-015-muted-apart';

describe('THEME-015', () => {
  it('passes the reading-list theme in both modes', () => {
    expect(runRules([rule], { theme, inventory })).toEqual([]);
  });

  it('fails the reported base pair with the measured contrast and the fix', () => {
    const copy = structuredClone(theme);
    copy.colors.light!.base.fg = '#28190F';
    copy.colors.light!.base.fgMuted = '#573B2A';
    expect(runRules([rule], { theme: copy, inventory })).toEqual([{
      rule: 'THEME-015', severity: 'mandatory', at: 'base.light.fgMuted',
      message: "base light: fgMuted #573B2A is 1.67:1 from fg #28190F; muted text needs 2:1 from fg so it reads as secondary. Pick a step for fgMuted further from fg's, such as 10 when fg is 12, and keep 4.5:1 on bg.",
    }]);
  });

  it('fails page text when pageFgMuted is too close to pageFg', () => {
    const copy = structuredClone(theme);
    copy.colors.dark!.page.pageFgMuted = copy.colors.dark!.page.pageFg;
    expect(runRules([rule], { theme: copy, inventory })).toEqual([expect.objectContaining({
      rule: 'THEME-015', severity: 'mandatory', at: 'page.dark.pageFgMuted',
      message: expect.stringContaining('1.00:1 from pageFg'),
    })]);
  });

  it('checks every set and the page in every mode', () => {
    const call = structuredClone(themeCall);
    for (const values of call.colors) {
      for (const steps of [values.theme, values.base, ...Object.values(values.status), ...values.entities.map((e) => e.steps)])
        steps.fgMuted = 11;
      values.page.pageFgMuted.step = 11;
    }
    const sets = ['theme', 'base', 'shelf', 'success', 'warning', 'error', 'info'];
    const at = runRules([rule], { theme: buildTheme(call), inventory }).map((issue) => issue.at);
    expect(at).toEqual([
      'page.light.pageFgMuted',
      'page.dark.pageFgMuted',
      ...['light', 'dark'].flatMap((mode) => sets.map((name) => `${name}.${mode}.fgMuted`)),
    ]);
  });
});
