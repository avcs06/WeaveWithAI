import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { STATUS_BANDS, STATUSES } from '../../brief';
import type { BriefInput } from '../helpers';

/**
 * BRIEF-007 · mandatory
 * Each status hue sits inside its band, so success reads as green, warning as
 * amber, error as red and info as blue in every theme
 * (the theme picks its status colors).
 * Pass: success 150, warning 80, error 25, info 240.
 * Fail: error at 200.
 */
export const rule = defineRule<BriefInput>('BRIEF-007', 'mandatory', ({ brief }, fail) => {
  const issues: Issue[] = [];
  for (const status of STATUSES) {
    const hue = brief.statusHues[status];
    const [low, high] = STATUS_BANDS[status];
    if (!(hue >= low && hue <= high))
      issues.push(fail(`statusHues.${status} is ${hue}, outside ${status}'s band of ${low} to ${high}, so it would not read as ${status}. Pick a ${status} hue from ${low} to ${high}.`, `statusHues.${status}`));
  }
  return issues;
});
