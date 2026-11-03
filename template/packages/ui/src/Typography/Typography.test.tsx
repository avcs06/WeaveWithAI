import { screen } from '@testing-library/react';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { Kbd, Mark, Separator, Time } from './auxiliary';
import {
  Caption,
  Code,
  CodeBlock,
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
  List,
  ListItem,
  Paragraph,
  Quote,
} from './Typography';
import * as styles from './Typography.css';

describe('Typography', () => {
  it('renders each element as its HTML element, keeping the caller’s class and attributes', async () => {
    const { container } = renderUI(
      <div>
        <Paragraph className="shrink-0" id="intro">
          Intro
        </Paragraph>
        <List>
          <ListItem>Point</ListItem>
        </List>
        <List ordered>
          <ListItem>Step</ListItem>
        </List>
        <DescriptionList>
          <div>
            <DescriptionTerm>Placed</DescriptionTerm>
            <DescriptionDetails>2 Nov</DescriptionDetails>
          </div>
        </DescriptionList>
        <Paragraph>
          Run <Code>pnpm dev</Code>
        </Paragraph>
        <CodeBlock>{'line one\n  line two'}</CodeBlock>
      </div>,
    );
    const intro = screen.getByText('Intro');
    expect(intro.tagName).toBe('P');
    expect(intro).toHaveClass(styles.paragraph, 'shrink-0');
    expect(intro).toHaveAttribute('id', 'intro');
    expect(screen.getByText('Point').closest('ul')).toHaveClass(
      styles.bulleted,
    );
    expect(screen.getByText('Step').closest('ol')).toHaveClass(styles.numbered);
    expect(screen.getByText('Placed').tagName).toBe('DT');
    expect(screen.getByText('2 Nov').tagName).toBe('DD');
    expect(screen.getByText('pnpm dev').tagName).toBe('CODE');
    const block = container.querySelector('pre')!;
    expect(block.textContent).toBe('line one\n  line two');
    expect(block).toHaveAttribute('tabindex', '0');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('takes a font and a color over what it inherits, and mutes a term by default', () => {
    renderUI(
      <div>
        <Paragraph font="display" color="error">
          Styled
        </Paragraph>
        <Paragraph>Plain</Paragraph>
        <DescriptionList>
          <DescriptionTerm>Muted</DescriptionTerm>
          <DescriptionTerm color="default">Default</DescriptionTerm>
          <DescriptionDetails>Value</DescriptionDetails>
        </DescriptionList>
      </div>,
    );
    expect(screen.getByText('Styled')).toHaveClass(
      styles.fonts.display,
      styles.textColors.error,
    );
    const plain = screen.getByText('Plain');
    for (const name of [
      ...Object.values(styles.fonts),
      ...Object.values(styles.textColors),
    ])
      expect(plain).not.toHaveClass(name);
    expect(screen.getByText('Muted')).toHaveClass(styles.textColors.muted);
    expect(screen.getByText('Default')).toHaveClass(styles.textColors.default);
  });

  it('shows a caption muted at its own size, or in the color it is given', async () => {
    const { container } = renderUI(
      <div>
        <Caption id="updated">Updated 2 Nov</Caption>
        <Caption color="error">Overdue</Caption>
      </div>,
    );
    const updated = screen.getByText('Updated 2 Nov');
    expect(updated.tagName).toBe('P');
    expect(updated).toHaveClass(styles.caption, styles.textColors.muted);
    expect(updated).toHaveAttribute('id', 'updated');
    const overdue = screen.getByText('Overdue');
    expect(overdue).toHaveClass(styles.textColors.error);
    expect(overdue).not.toHaveClass(styles.textColors.muted);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows a quote alone, or in a figure with its source', async () => {
    const { container } = renderUI(
      <div>
        <Quote id="alone">Alone</Quote>
        <Quote id="sourced" source="Priya">
          Sourced
        </Quote>
      </div>,
    );
    const alone = screen.getByText('Alone');
    expect(alone.tagName).toBe('BLOCKQUOTE');
    expect(alone).toHaveAttribute('id', 'alone');
    // The figure holds the quote and its source; the quote keeps its own attributes.
    const sourced = screen.getByText('Sourced');
    expect(sourced).toHaveAttribute('id', 'sourced');
    expect(sourced.closest('figure')).not.toBeNull();
    expect(screen.getByText('Priya').tagName).toBe('FIGCAPTION');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows a key in the mono font, or in the font and color it is given', async () => {
    const { container } = renderUI(
      <Paragraph>
        Press <Kbd id="search">Ctrl K</Kbd> or{' '}
        <Kbd font="ui" color="primary">
          Esc
        </Kbd>
      </Paragraph>,
    );
    const search = screen.getByText('Ctrl K');
    expect(search.tagName).toBe('KBD');
    expect(search).toHaveClass(styles.kbd, styles.fonts.mono);
    expect(search).toHaveAttribute('id', 'search');
    const esc = screen.getByText('Esc');
    expect(esc).toHaveClass(styles.fonts.ui, styles.textColors.primary);
    expect(esc).not.toHaveClass(styles.fonts.mono);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('marks text in the color around it, or in the color it is given', async () => {
    const { container } = renderUI(
      <Paragraph>
        Spring <Mark id="match">launch</Mark> plan,{' '}
        <Mark color="error">late</Mark>
      </Paragraph>,
    );
    const match = screen.getByText('launch');
    expect(match.tagName).toBe('MARK');
    expect(match).toHaveClass(styles.highlight, styles.inheritColor);
    expect(match).toHaveAttribute('id', 'match');
    const late = screen.getByText('late');
    expect(late).toHaveClass(styles.textColors.error);
    expect(late).not.toHaveClass(styles.inheritColor);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('draws a separator across its column, or vertical in a row', async () => {
    const { container } = renderUI(
      <div>
        <Separator id="across" />
        <div className="flex-row-gap-3">
          <Separator orientation="vertical" />
        </div>
      </div>,
    );
    const [across, vertical] = screen.getAllByRole('separator');
    expect(across.tagName).toBe('HR');
    expect(across).toHaveClass(styles.separator, styles.horizontal);
    expect(across).toHaveAttribute('id', 'across');
    expect(across).not.toHaveAttribute('aria-orientation');
    // A column that starts its items would shrink it to nothing.
    expect(across).toHaveClass('self-stretch');
    expect(vertical).toHaveClass(styles.vertical, 'self-stretch', 'h-auto');
    expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows a date in the app's format, a moment with its time on request, and anything else as given", async () => {
    const { container } = renderUI(
      <div>
        <Time id="placed" value="2026-11-07" />
        {/* Midday UTC: the same day in any time zone the tests run in. */}
        <Time value="2026-03-14T12:00:00.000Z" />
        <Time value="2026-03-14T12:00:00.000Z" withTime color="muted" />
        <Time value="next week" />
      </div>,
    );
    const placed = screen.getByText('7 Nov 2026');
    expect(placed.tagName).toBe('TIME');
    expect(placed).toHaveAttribute('datetime', '2026-11-07');
    expect(placed).toHaveAttribute('id', 'placed');
    expect(screen.getByText('14 Mar 2026')).toHaveAttribute(
      'datetime',
      '2026-03-14T12:00:00.000Z',
    );
    expect(screen.getByText(/^14 Mar 2026, \d{2}:\d{2}$/)).toHaveClass(
      styles.textColors.muted,
    );
    expect(screen.getByText('next week').tagName).toBe('TIME');
    expect(await axe(container)).toHaveNoViolations();
  });
});
