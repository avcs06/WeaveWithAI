import type { ClassRule } from '../../classname-adapter.js';

/** Variants (`hover:`), arbitrary values (`w-[3px]`) and negative modifiers (`-mt-2`) are never allowed. */
export const restrictedSyntax: ClassRule = (className) =>
  className.includes(':') || className.includes('[') || className.includes(']') || className.startsWith('-')
    ? {
        rule: 'restricted-class',
        message: `"${className}" uses a disallowed Tailwind variant, selector, arbitrary value, or negative modifier.`,
      }
    : undefined;
