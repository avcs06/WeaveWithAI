/**
 * FLOW-018 · warning
 * No layout or component words: left, right, top, bottom, sidebar, navbar, modal, dialog, popup, dropdown, drawer, tab, tooltip, toast, hamburger, pixel.
 * Pass: 'Shows the note.'
 * Fail: 'A modal on the right shows the note.'
 */
import type { Issue } from '../../../core/issues';
import { defineRule, wholeWords } from '../../../core/rules';
import { type FlowInput, flowTexts } from './helpers';

export const LAYOUT_WORDS = [
  'left', 'right', 'top', 'bottom', 'sidebar', 'navbar', 'modal', 'dialog', 'popup', 'dropdown',
  'drawer', 'tab', 'tooltip', 'toast', 'hamburger', 'pixel',
];

export const rule = defineRule<FlowInput>('FLOW-018', 'warning', ({ flows }, fail) => {
  const issues: Issue[] = [];
  for (const flow of flows.flows) {
    for (const { at, text } of flowTexts(flow)) {
      const found = wholeWords(text, LAYOUT_WORDS);
      if (found.length > 0) {
        issues.push(fail(`${at} uses layout words (${found.join(', ')}); say what the website shows, not where or in which component.`, at));
      }
    }
  }
  return issues;
});
