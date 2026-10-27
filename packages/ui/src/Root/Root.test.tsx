import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { axe } from '../test-utils';
import { Tooltip } from '../Tooltip';

import { UIProviders } from './auxiliary';

// `renderUI` would wrap in these same providers, hiding their absence, so
// these render bare. `UIRoot` itself loads next/font, which jest can't, and
// renders the document's <html>; only its providers are testable here.

const tooltipTree = (
  <Tooltip tooltip="Saves a draft">
    <button type="button">Save</button>
  </Tooltip>
);

// The shown tooltip is aria-hidden: the trigger's description already says
// it to screen readers, so role queries include hidden elements to see it.
const findTooltip = () => screen.findByRole('tooltip', { hidden: true });
const queryTooltip = () => screen.queryByRole('tooltip', { hidden: true });

const saveButton = () => screen.getByRole('button', { name: 'Save' });

describe('UIProviders', () => {
  it('renders its children as they are', async () => {
    const { container } = render(
      <UIProviders>
        <h1>Day one</h1>
        <button type="button">Check in</button>
      </UIProviders>,
    );

    expect(
      screen.getByRole('heading', { name: 'Day one' }),
    ).toBeInTheDocument();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Check in' })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('gives its children the tooltip provider UIRoot gives the app', async () => {
    render(<UIProviders tooltipDelay={0}>{tooltipTree}</UIProviders>);

    // No provider, and the Tooltip cannot even render; here the trigger is
    // described before anything shows.
    expect(saveButton()).toHaveAccessibleDescription('Saves a draft');
    expect(queryTooltip()).toBeNull();

    await userEvent.hover(saveButton());
    expect(await findTooltip()).toHaveTextContent('Saves a draft');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('a Tooltip inside opens on keyboard focus and closes on Escape', async () => {
    render(<UIProviders tooltipDelay={0}>{tooltipTree}</UIProviders>);

    await userEvent.tab();
    expect(saveButton()).toHaveFocus();
    expect(await findTooltip()).toHaveTextContent('Saves a draft');

    await userEvent.keyboard('{Escape}');
    expect(queryTooltip()).toBeNull();
    // Escape only closes the tooltip; focus stays on its trigger.
    expect(saveButton()).toHaveFocus();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('tooltipDelay reaches the provider: the default delay holds the tooltip back, then it opens', async () => {
    render(<UIProviders tooltipDelay={600}>{tooltipTree}</UIProviders>);

    await userEvent.hover(saveButton());
    expect(queryTooltip()).toBeNull();
    expect(await findTooltip()).toHaveTextContent('Saves a draft');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
