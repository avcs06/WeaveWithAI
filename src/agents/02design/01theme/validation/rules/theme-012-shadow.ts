import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { STATUSES } from '../../brief';
import type { CallInput } from '../helpers';

/** The darkest step of a ramp in each mode: the last in light, the first in dark. */
const DARKEST = { light: 12, dark: 1 } as const;

/**
 * THEME-012 · warning
 * Every set's shadow is its ramp's darkest step: 12 in light mode, 1 in dark.
 * A warning: a lighter shadow only softens the depth.
 * Pass: the reading-list theme.
 * Fail: the light theme set's shadow at step 9.
 */
export const rule = defineRule<CallInput>('THEME-012', 'warning', ({ call }, fail) => {
  const issues: Issue[] = [];
  for (const { mode, theme, base, status, entities } of call.colors) {
    const sets = [
      ['theme', theme],
      ['base', base],
      ...STATUSES.map((name) => [name, status[name]] as const),
      ...entities.map((e) => [e.noun, e.steps] as const),
    ] as const;
    for (const [name, set] of sets)
      if (set.shadow !== DARKEST[mode])
        issues.push(fail(`${name} ${mode}: shadow is step ${set.shadow}. A shadow is the darkest step, ${DARKEST[mode]} in ${mode} mode. Set shadow to step ${DARKEST[mode]}.`, `${name}.${mode}.shadow`));
  }
  return issues;
});
