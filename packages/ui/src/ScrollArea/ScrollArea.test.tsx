import { fireEvent, screen } from '@testing-library/react';
import React, { createRef } from 'react';

import { axe, renderUI } from '../test-utils';

import { FlexScrollArea, ScrollArea } from './index';

// Geometry, overflow and scrollbar dragging also require browser verification.
describe.each([
  ['ScrollArea', ScrollArea],
  ['FlexScrollArea', FlexScrollArea],
] as const)('%s contract', (_name, Component) => {
  it('renders its content and forwards separate root and viewport refs', () => {
    const root = createRef<HTMLDivElement>();
    const viewport = createRef<HTMLDivElement>();
    renderUI(
      <Component ref={root} viewportRef={viewport} style={{ maxHeight: 120 }}>
        Scrollable content
      </Component>,
    );
    expect(screen.getByText('Scrollable content')).toBeInTheDocument();
    expect(root.current).toBeInstanceOf(HTMLDivElement);
    expect(viewport.current).toBeInstanceOf(HTMLDivElement);
    expect(viewport.current).not.toBe(root.current);
    expect(root.current).toContainElement(viewport.current);
    expect(root.current).toHaveStyle({ maxHeight: '120px' });
  });

  it('forwards scroll events from the actual viewport', () => {
    const viewport = createRef<HTMLDivElement>();
    const onScroll = jest.fn();
    renderUI(
      <Component viewportRef={viewport} onViewportScroll={onScroll}>
        Content
      </Component>,
    );
    expect(viewport.current).not.toBeNull();
    fireEvent.scroll(viewport.current!, { target: { scrollTop: 30 } });
    expect(onScroll).toHaveBeenCalledTimes(1);
    expect(onScroll.mock.calls[0][0].target).toBe(viewport.current);
  });

  it.each(['vertical', 'horizontal', 'both'] as const)(
    'renders accessible %s content',
    async (orientation) => {
      const { container } = renderUI(
        <Component orientation={orientation}>
          <p>Readable content</p>
        </Component>,
      );
      expect(screen.getByText('Readable content')).toBeVisible();
      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
