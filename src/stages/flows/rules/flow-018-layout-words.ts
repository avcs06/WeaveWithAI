/**
 * FLOW-018 · warning
 * No layout or component words, subflows included: left, right, top, bottom, sidebar, navbar, modal, dialog, popup, dropdown, drawer, tab, tooltip, toast, hamburger, pixel.
 * Pass: 'Shows the note.'
 * Fail: 'A modal on the right shows the note.'
 */
import type { Issue } from '../../../core/issues';
import { defineRule, wholeWords } from '../../../core/rules';
import { containers, containerTexts, type FlowInput } from './helpers';

export const LAYOUT_WORDS = [
  'left',
  'right',
  'top',
  'bottom',
  'sidebar',
  'navbar',
  'modal',
  'dialog',
  'popup',
  'dropdown',
  'drawer',
  'tab',
  'tooltip',
  'toast',
  'hamburger',
  'pixel',
];

export const rule = defineRule<FlowInput>(
  'FLOW-018',
  'warning',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const container of containers(flows)) {
      for (const { at, text } of containerTexts(container)) {
        const found = wholeWords(text, LAYOUT_WORDS);
        if (found.length > 0) {
          issues.push(
            fail(
              `${at} uses layout words (${found.join(', ')}); say what the website shows, not where or in which component.`,
              at,
            ),
          );
        }
      }
    }
    return issues;
  },
);
