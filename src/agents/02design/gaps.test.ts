import { describe, expect, it } from 'vitest';
import type { ModelNode } from './06draw/schema';
import { withFixedGaps } from './gaps';
import type { NodeLayout } from './schema';

const layout = (direction: NodeLayout['direction']): NodeLayout => ({
  direction,
  gap: '2',
  padding: '0',
  columns: 0,
  align: 'stretch',
  justify: 'start',
  wrap: false,
});
let order = 0;
const node = (id: string, parent: string, role: ModelNode['role'], more: Partial<ModelNode> = {}) =>
  ({ id, parent, order: order++, role, component: 'none', what: role, layout: null, ...more }) as ModelNode;
const box = (id: string, parent: string, direction: NodeLayout['direction'] = 'column') =>
  node(id, parent, 'container', { layout: layout(direction) });
const input = (id: string, parent: string) => node(id, parent, 'input', { component: 'Input' });

const gaps = (nodes: ModelNode[], lists = false) => {
  const fixed = withFixedGaps({ layout: layout('column'), nodes }, lists);
  return {
    root: fixed.layout.gap,
    ...Object.fromEntries(fixed.nodes.filter((n) => n.layout).map((n) => [n.id, n.layout!.gap])),
  };
};

describe('withFixedGaps', () => {
  it('spaces a title and its description 4, a header and its content 16, and content 16', () => {
    expect(
      gaps([
        box('n01', '', 'column'),
        node('n02', 'n01', 'heading'),
        node('n03', 'n01', 'text'),
        input('n04', ''),
        input('n05', ''),
        box('n06', '', 'row'),
        node('n07', 'n06', 'primary-action'),
        node('n08', 'n06', 'secondary-action'),
      ]),
    ).toEqual({ root: '4', n01: '1', n06: '2' });
  });

  it('spaces two or more groups 24, and content with one group 16', () => {
    const groups = [
      box('n01', ''),
      input('n02', 'n01'),
      input('n03', 'n01'),
      box('n04', ''),
      input('n05', 'n04'),
      input('n06', 'n04'),
      node('n07', '', 'primary-action', { component: 'Button' }),
    ];
    expect(gaps(groups)).toEqual({ root: '6', n01: '4', n04: '4' });
    expect(gaps(groups.filter((n) => !['n04', 'n05', 'n06'].includes(n.id)))).toEqual({ root: '4', n01: '4' });
  });

  it("keeps the model's gap for a header above two groups, for text alone, and for a list's repeated rows", () => {
    const mixed = [
      node('n01', '', 'heading'),
      box('n02', ''),
      input('n03', 'n02'),
      input('n04', 'n02'),
      box('n05', ''),
      input('n06', 'n05'),
      input('n07', 'n05'),
    ];
    expect(gaps(mixed).root).toBe('2');
    expect(gaps([node('n01', '', 'text'), node('n02', '', 'text')]).root).toBe('2');
    // A heading over two paragraphs is no title and description: the paragraphs keep their spacing.
    expect(gaps([node('n01', '', 'heading'), node('n02', '', 'text'), node('n03', '', 'text')]).root).toBe('2');
    const rows = [
      node('n01', '', 'heading'),
      node('n02', '', 'display', { component: 'ListItem' }),
      node('n03', '', 'display', { component: 'ListItem' }),
    ];
    expect(gaps(rows, true).root).toBe('2');
    // The same repeated items outside a list are content.
    expect(gaps(rows, false).root).toBe('4');
  });
});
