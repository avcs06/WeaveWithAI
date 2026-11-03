import { readFileSync } from 'node:fs';
import { pathBeside } from '../core/utils';

// The UX practices every screen follows, kept in the template so each generated
// app carries them: the architect, its peer reviewer, the coding sessions and
// the adherence reviewer all read the same file.

export const UX_FILE = 'UX.md';

/** The sections the design prose decides; the others name components and spacing, which the coding agent meets. */
export const DESIGN_SECTIONS = ['Lists and records', 'Actions', 'Editing', 'Copy'];

/** The practices as prompt text, without the title line: every section, or only the named ones. */
export function uxPractices(sections?: string[]): string {
  const text = readFileSync(pathBeside(import.meta.url, `../../template/${UX_FILE}`), 'utf8');
  const body = text.replace(/^# .*\n+/, '').trim();
  if (!sections) return body;
  const [intro, ...rest] = body.split(/^## /m);
  const kept = rest.filter((section) => sections.includes(section.split('\n')[0]?.trim() ?? ''));
  const missing = sections.filter((name) => !kept.some((section) => section.startsWith(name)));
  if (missing.length) throw new Error(`${UX_FILE} has no section ${missing.join(', ')}`);
  return [intro?.trim(), ...kept.map((section) => `## ${section.trim()}`)].filter(Boolean).join('\n\n');
}
