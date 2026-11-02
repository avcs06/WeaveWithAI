import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { pathBeside } from '../../core/utils';

// The flows users expect of each kind of app, and of situations many apps
// share (domains.json): the scope picks the ones that fit the idea, and the
// catalog gives each must-have a flow or a skip with its reason.

export const Domain = z.object({
  id: z.string(),
  name: z.string(),
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

/** The list the scope picks from: each id, its name and the ideas it fits. */
export const domainList = (): string =>
  DOMAINS.map(
    (domain) => `- \`${domain.id}\`: ${domain.name}. ${domain.fits}`,
  ).join('\n');

/** The flows users expect of the domains the scope picked, as the catalog reads them. */
export function domainChecklist(ids: string[]): string {
  const picked = DOMAINS.filter((domain) => ids.includes(domain.id));
  if (picked.length === 0) return 'None.';
  return picked
    .map((domain) =>
      [
        `## ${domain.name}`,
        '',
        'Must have:',
        ...domain.mustHave.map((flow) => `- ${flow}`),
        ...(domain.often.length
          ? [
              '',
              'Often, when the idea hints at it:',
              ...domain.often.map((flow) => `- ${flow}`),
            ]
          : []),
      ].join('\n'),
    )
    .join('\n\n');
}
