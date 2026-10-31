import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { googleFont } from '../../../config/fonts';
import type { ThemeInput } from './theme-helpers';

/**
 * THEME-004 · mandatory
 * Fonts are in the Google catalog with a latin subset; radius values are on the
 * design system's radius scale; the focus ring is halo, offset or glow.
 * Pass: Inter, Playfair Display, JetBrains Mono; 8px and 6px; halo.
 * Fail: a ui font of Comic Sans MS.
 */
export const rule = defineRule<ThemeInput>(
  'THEME-004',
  'mandatory',
  ({ theme, inventory }, fail) => {
    const issues: Issue[] = [];
    for (const [role, name] of Object.entries(theme.fonts))
      if (!googleFont(name)?.latin)
        issues.push(
          fail(
            `The ${role} font ${name} is not a Google font with a latin subset in the catalog; pick one from the list.`,
            `fonts.${role}`,
          ),
        );
    const scale = new Set(
      inventory.tokens.filter((t) => t.group === 'radius').map((t) => t.value),
    );
    for (const [part, value] of Object.entries(theme.radius))
      if (!scale.has(value))
        issues.push(
          fail(
            `radius.${part} is ${value}, not on the design system's radius scale.`,
            `radius.${part}`,
          ),
        );
    if (!['halo', 'offset', 'glow'].includes(theme.focusRing))
      issues.push(
        fail(
          `focusRing is ${theme.focusRing}; it is halo, offset or glow.`,
          'focusRing',
        ),
      );
    return issues;
  },
);
