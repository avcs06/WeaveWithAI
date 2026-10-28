import { composeHandlers } from './events';

const event = (defaultPrevented = false) => ({
  defaultPrevented,
  preventDefault() {
    this.defaultPrevented = true;
  },
});

describe('composeHandlers', () => {
  it('runs the handler, then its own', () => {
    const calls: string[] = [];
    composeHandlers(
      () => calls.push('handler'),
      () => calls.push('own'),
    )(event());
    expect(calls).toEqual(['handler', 'own']);
  });

  it('skips its own when the handler prevents the default', () => {
    const own = jest.fn();
    composeHandlers((e: ReturnType<typeof event>) => e.preventDefault(), own)(
      event(),
    );
    expect(own).not.toHaveBeenCalled();
  });

  it('still runs its own when the default was prevented before, like by a child', () => {
    const own = jest.fn();
    composeHandlers(undefined, own)(event(true));
    expect(own).toHaveBeenCalledTimes(1);
  });
});
