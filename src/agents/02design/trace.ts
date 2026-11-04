import type { Scope } from '../01flows/01scope/schema';
import type { Flows } from '../01flows/schema';

// A later stage may name only what an earlier one gave the user. The theme's
// frame slots and the architect's steps are free text, so the check is by
// word: a thing passes when one of its content words is the app's, a flow's
// or a frame's. It catches help, search or a cart no flow has, not an
// invention dressed in the app's own nouns; the reviewers judge those.

/** What every frame may name with no flow behind it: the brand, the account and the way around. */
const FRAME_WORDS = [
  'wordmark', 'logo', 'brand', 'tagline', 'copyright', 'account', 'profile', 'avatar',
  'sign', 'login', 'logout', 'menu', 'navigation', 'nav', 'home', 'back',
];
/** What any dialog or form may say with no flow behind it. */
const UI_WORDS = ['cancel', 'confirm', 'save', 'submit', 'retry', 'try', 'close', 'done', 'ok', 'continue', 'next', 'previous', 'skip', 'yes', 'no', 'undo', 'learn'];
/** Words that say nothing about what a thing is: glue, positions, generic verbs and design words. */
const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'its', 'their', 'your', 'own', 'this', 'that', 'it',
  'is', 'are', 'as', 'at', 'by', 'from', 'which', 'where', 'when', 'what', 'who', 'they', 'them', 'each', 'every', 'all',
  'any', 'one', 'two', 'three', 'four', 'new', 'main', 'short', 'current', 'primary', 'secondary', 'first', 'last', 'top',
  'bottom', 'left', 'right', 'start', 'started', 'end', 'center', 'there', 'here', 'no', 'not', 'yet', 'also', 'again',
  'only', 'so', 'then', 'if', 'be', 'has', 'have', 'had', 'do', 'does', 'how', 'why', 'under', 'over', 'above', 'below',
  'beside', 'per', 'such', 'into', 'out', 'up', 'down', 'off', 'id', 'ids',
  'button', 'buttons', 'link', 'links', 'list', 'lists', 'bar', 'area', 'section', 'icon', 'icons', 'item', 'items',
  'entry', 'entries', 'page', 'pages', 'screen', 'screens', 'dialog', 'dialogs', 'action', 'actions', 'control',
  'controls', 'field', 'fields', 'form', 'forms', 'text', 'name', 'names', 'title', 'titles', 'label', 'labels', 'number',
  'numbers', 'time', 'date', 'count', 'counts', 'way', 'line', 'lines', 'row', 'rows', 'card', 'cards', 'tab', 'tabs',
  'goes', 'go', 'leads', 'lead', 'shows', 'show', 'opens', 'open', 'lets', 'let', 'can', 'sees', 'see', 'reads', 'read',
  'chooses', 'choose', 'picks', 'pick', 'fills', 'fill', 'types', 'type', 'enters', 'enter', 'keeps', 'keep', 'makes',
  'make', 'gets', 'get', 'sets', 'set', 'uses', 'use', 'changes', 'change', 'closes', 'nothing', 'something', 'anything',
  'user', 'users', 'visitor', 'visitors', 'website', 'app', 'information', 'details', 'more',
]);

/** A word's stem: lowercase, no plural. */
export function stem(word: string): string {
  const w = word.toLowerCase();
  if (w.endsWith('ies') && w.length > 4) return `${w.slice(0, -3)}y`;
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  return w;
}

/** The content words of a text, as stems: no glue, positions, generic verbs or design words. */
export function words(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z]+/)
    .filter((word) => word.length > 1)
    .map(stem)
    .filter((word) => !STOP.has(word));
}

/** Every stem the app, its roles, its records, its flows and their fields give a later stage to name, plus a frame's own words. */
export function allowedWords(scope: Scope, flows: Flows): Set<string> {
  const texts = [
    scope.app.name,
    ...scope.roles.flatMap((role) => [role.id, role.name]),
    ...scope.vocabulary.map((entry) => entry.noun),
    ...flows.flows.flatMap((flow) => [flow.name, flow.kind]),
    ...flows.fields.map((field) => field.label),
    ...flows.forms.map((form) => form.name),
  ];
  return new Set([...texts.flatMap(words), ...FRAME_WORDS, ...UI_WORDS]);
}

/** True when the text names something allowed, or names nothing at all. */
export const traced = (text: string, allowed: Set<string>): boolean => {
  const found = words(text);
  return found.length === 0 || found.some((word) => allowed.has(word));
};

/** The items of a slot's text, split at commas and "and", that name nothing the allowed words cover. */
export function untracedItems(text: string, allowed: Set<string>): string[] {
  return text
    .split(/,|;|\band\b|\bor\b/)
    .map((item) => item.trim())
    .filter((item) => item && !traced(item, allowed));
}
