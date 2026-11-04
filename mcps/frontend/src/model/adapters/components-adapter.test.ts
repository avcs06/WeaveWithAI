import { describe, expect, it } from 'vitest';

import { loadPackageComponents } from './components-adapter.js';

describe('components-adapter dispatch', () => {
  it('requires a package name for packages', () => {
    expect(() => loadPackageComponents({} as never, process.cwd())).toThrow(/"package"/);
  });

  it('skips a package whose types cannot be resolved rather than failing the whole load', () => {
    expect(loadPackageComponents({ package: 'definitely-not-installed-xyz' }, process.cwd())).toEqual([]);
  });
});
