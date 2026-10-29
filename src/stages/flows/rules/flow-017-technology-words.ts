/**
 * FLOW-017 · mandatory
 * No technology words in goals, outcomes, steps or alternatives: endpoint, API, HTTP, REST, GraphQL, SQL, database, JSON, or upper-case GET, POST, PUT, PATCH, DELETE.
 * Pass: websiteResponse: 'Shows the saved book in the list.'
 * Fail: 'Calls the API and saves the JSON.' · 'POST the form' (lower-case 'post' as in 'a blog post' is fine)
 */
import type { Issue } from '../../../core/issues';
import { defineRule, wholeWords } from '../../../core/rules';
import { type FlowInput, flowTexts } from './helpers';

export const TECHNOLOGY_WORDS = ['endpoint', 'API', 'HTTP', 'REST', 'GraphQL', 'SQL', 'database', 'JSON'];
export const HTTP_VERBS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const rule = defineRule<FlowInput>('FLOW-017', 'mandatory', ({ flows }, fail) => {
  const issues: Issue[] = [];
  for (const flow of flows.flows) {
    for (const { at, text } of flowTexts(flow)) {
      const found = [...wholeWords(text, TECHNOLOGY_WORDS), ...wholeWords(text, HTTP_VERBS, { caseSensitive: true })];
      if (found.length > 0) {
        issues.push(fail(`${at} uses technology words (${found.join(', ')}); describe what the user sees instead, in plain words.`, at));
      }
    }
  }
  return issues;
});
