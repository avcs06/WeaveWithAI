const nxResolver = require('@nx/jest/plugins/resolver');

/**
 * vanilla-extract files are imported as `./x.css` but live in `x.css.ts`.
 * Nx's resolver mocks every `.css` import, which would stub the styles and
 * tokens out; try the `.css.ts` file first.
 */
module.exports = (request, options) => {
  if (request.endsWith('.css')) {
    try {
      return nxResolver(`${request}.ts`, options);
    } catch {
      // A real stylesheet: Nx mocks it.
    }
  }
  return nxResolver(request, options);
};
