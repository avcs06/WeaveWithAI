import { screen } from '@testing-library/react';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import {
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
});
