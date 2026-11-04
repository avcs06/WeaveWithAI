import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { pathBeside } from '../../core/utils';

// The flows users expect of each kind of app, and of situations many apps
// share (domains.json): the scope picks the ones that fit the idea, and the
// catalog gives each must-have a flow or a skip with its reason.

export const DOMAIN_TYPES = ['app', 'situation'] as const;

export const Domain = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(DOMAIN_TYPES),
  fits: z.string(),
  mustHave: z.array(z.string()),
  often: z.array(z.string()),
});

export type Domain = z.infer<typeof Domain>;

export const DOMAINS: Domain[] = z
  .array(Domain)
  .parse(
    JSON.parse(
      readFileSync(pathBeside(import.meta.url, './domains.json'), 'utf8'),
    ),
  );

export const DOMAIN_IDS = DOMAINS.map((domain) => domain.id) as [
  string,
  ...string[],
];

/** A list the scope picks from, kinds of app or situations: each id, its name and the ideas it fits. */
export const domainList = (type: Domain['type']): string =>
  DOMAINS.filter((domain) => domain.type === type)
    .map((domain) => `- \`${domain.id}\`: ${domain.name}. ${domain.fits}`)
    .join('\n');

/** The flows users expect of the domains the scope picked, as the catalog reads them; a domain with no flows listed yet shows what it fits. */
export function domainChecklist(ids: string[]): string {
  const picked = DOMAINS.filter((domain) => ids.includes(domain.id));
  if (picked.length === 0) return 'None.';
  const block = (title: string, flows: string[]) =>
    flows.length ? ['', title, ...flows.map((flow) => `- ${flow}`)] : [];
  return picked
    .map((domain) =>
      [
        `## ${domain.name}`,
        ...(domain.mustHave.length + domain.often.length === 0
          ? ['', domain.fits]
          : []),
        ...block('Must have:', domain.mustHave),
        ...block('Often, when the idea hints at it:', domain.often),
      ].join('\n'),
    )
    .join('\n\n');
}
