import { readFileSync } from 'node:fs';
import { pathBeside } from '../core/utils';

// The UX practices every screen follows, kept in the template so each generated
// app carries them: the architect, its peer reviewer, the coding sessions and
// the adherence reviewer all read the same file.

export const UX_FILE = 'UX.md';

/** The practices as prompt text: the file without its title line. */
export function uxPractices(): string {
  const text = readFileSync(pathBeside(import.meta.url, `../../template/${UX_FILE}`), 'utf8');
  return text.replace(/^# .*\n+/, '').trim();
}
