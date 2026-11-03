import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { Theme } from '../../02design/01theme/build';
import type { Architecture } from '../../02design/02architect/schema';
import { routeGroups, signedInFrame, signInRoute } from '../01scaffold/weave';
import { layoutParts, layoutPath, layoutSource, partSource, pascal } from '../parts';

// The layout and parts of a frame beyond the app's and the marketing site's,
// which the scaffold wrote from the template. A second frame of a kind gets
// its own route group: PageLayout with its kind's layout, the redirect of a
// signed-in frame, and one part per area, with the logo and the account where
// the theme put them. The layout files and PageLayout are protected, so the
// frame's size, sticking and container stay as the theme set them.

/** The further frames' layouts and parts, by path. Frames without screens have no route group, so none. Pure. */
export function frameSkeletons(architecture: Architecture, flows: Flows, scope: Scope, theme: Theme): Map<string, string> {
  const files = new Map<string, string>();
  const groups = routeGroups(architecture, flows, scope);
  const wiring = { signInHref: signInRoute(architecture, flows) };
  for (const frame of architecture.frames) {
    const group = groups.get(frame.id);
    const signedIn = signedInFrame(architecture, flows, scope, frame);
    const kind = signedIn ? 'app' : 'marketing';
    if (!group || group === kind) continue;
    const parts = layoutParts(pascal(group), theme.layouts[kind]);
    files.set(layoutPath(group), layoutSource(`${pascal(group)}Layout`, `${frame.name} (${frame.id}).`, kind, parts, signedIn));
    for (const part of parts) {
      files.set(`web/app/components/${part.name}/${part.name}.tsx`, partSource(part, undefined, wiring));
      files.set(`web/app/components/${part.name}/index.ts`, `export { ${part.name} } from './${part.name}';\n`);
    }
  }
  return files;
}
