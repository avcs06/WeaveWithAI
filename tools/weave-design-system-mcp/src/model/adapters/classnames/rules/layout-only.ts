import type { ClassRule } from '../../classname-adapter.js';

/** Design-system files may only use layout utilities in Tailwind; everything else is vanilla-extract. */
export const layoutOnly: ClassRule = (className, { policy, designSystem }) =>
  designSystem && !policy.layoutClasses?.has(className.replace(/^!/, ''))
    ? {
        rule: 'restricted-class',
        message: `"${className}" is not a layout utility. Design-system components style everything except layout with vanilla-extract.`,
      }
    : undefined;
