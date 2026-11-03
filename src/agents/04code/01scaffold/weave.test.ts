import { describe, expect, it } from 'vitest';
import { architecture, flows, scope } from '../../02design/__fixtures__/chain';
import { routeGroups, screenFolder } from './weave';

describe('route groups', () => {
  it('put the public frame in the template\'s marketing group and the signed-in one in its app group', () => {
    expect(routeGroups(architecture, flows, scope)).toEqual(new Map([['FR01', 'marketing'], ['FR02', 'app']]));
    const books = architecture.screens.find((screen) => screen.id === 'S04')!;
    expect(screenFolder(architecture, flows, scope, books)).toBe('web/app/(routes)/(app)/books');
  });

  it('name a second frame of a kind after itself, by its id when the name is taken, and give a frame without screens none', () => {
    const app = architecture.frames.find((frame) => frame.id === 'FR02')!;
    const books = architecture.screens.find((screen) => screen.id === 'S04')!;
    const more = {
      ...architecture,
      frames: [
        ...architecture.frames,
        { ...app, id: 'FR03', name: 'Admin frame' },
        { ...app, id: 'FR04', name: 'App frame' },
        { ...app, id: 'FR05', name: 'Empty frame' },
      ],
      screens: [
        ...architecture.screens,
        { ...books, id: 'S06', frame: 'FR03', route: '/admin' },
        { ...books, id: 'S07', frame: 'FR04', route: '/more' },
      ],
    };
    expect(routeGroups(more, flows, scope)).toEqual(
      new Map([['FR01', 'marketing'], ['FR02', 'app'], ['FR03', 'admin'], ['FR04', 'fr04']]),
    );
  });
});
