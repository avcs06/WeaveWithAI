import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type ComponentProps } from 'react';

import { caption } from '../StoryStyles.css';
import { axe, renderUI } from '../test-utils';

import { Link } from './Link';
import { linkRecipe } from './Link.recipes.css';

const { variants } = linkRecipe.classNames;

// Radix opens after a timer: wait past it before asserting that nothing opened.
const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 50)));

const findTooltip = () => screen.findByRole('tooltip', { hidden: true });
const queryTooltip = () => screen.queryByRole('tooltip', { hidden: true });

describe('Link', () => {
  it('is a link to its href, reachable by keyboard and followed with Enter', async () => {
    const onClick = jest.fn((event: React.MouseEvent) =>
      event.preventDefault(),
    );
    const { container } = renderUI(
      <Link href="/docs" onClick={onClick}>
        Documentation
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link).toHaveAttribute('href', '/docs');
    await userEvent.tab();
    expect(link).toHaveFocus();
    // Space scrolls the page; only Enter follows a link.
    await userEvent.keyboard(' ');
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when enabled: a plain anchor, with no disabled attributes', async () => {
    const { container } = renderUI(<Link href="/docs">Documentation</Link>);
    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link).not.toHaveAttribute('aria-disabled');
    expect(link).not.toHaveAttribute('data-disabled');
    expect(link).not.toHaveAttribute('role');
    expect(link).not.toHaveAttribute('tabindex');
    expect(link).not.toHaveAttribute('aria-describedby');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes anchor props through: mailto, tel, download and a new tab', async () => {
    const { container } = renderUI(
      <>
        <Link href="mailto:organizers@example.com">Email the organizers</Link>
        <Link href="tel:+31201234567">Call the venue</Link>
        <Link href="/files/schedule.pdf" download>
          Download the schedule (PDF)
        </Link>
        <Link
          href="https://example.com/venues/harbor-hall"
          target="_blank"
          rel="noopener noreferrer"
        >
          Harbor Hall venue page
          <span className="sr-only"> (opens in a new tab)</span>
        </Link>
      </>,
    );
    expect(
      screen.getByRole('link', { name: 'Email the organizers' }),
    ).toHaveAttribute('href', 'mailto:organizers@example.com');
    expect(screen.getByRole('link', { name: 'Call the venue' })).toHaveAttribute(
      'href',
      'tel:+31201234567',
    );
    const download = screen.getByRole('link', {
      name: 'Download the schedule (PDF)',
    });
    expect(download).toHaveAttribute('href', '/files/schedule.pdf');
    expect(download).toHaveAttribute('download');
    const external = screen.getByRole('link', {
      name: 'Harbor Hall venue page (opens in a new tab)',
    });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('applies the variant and the plain look', () => {
    renderUI(
      <>
        <Link href="/a">Default</Link>
        <Link href="/b" variant="base">
          Base
        </Link>
        <Link href="/c" look="plain">
          Plain
        </Link>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Default' })).toHaveClass(
      variants.variant.default,
    );
    expect(screen.getByRole('link', { name: 'Base' })).toHaveClass(
      variants.variant.base,
    );
    expect(screen.getByRole('link', { name: 'Plain' })).toHaveClass(
      variants.plain.true,
    );
  });

  it('when disabled: no href, ignores clicks and leaves the tab order, with nothing to read', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <>
        <Link href="/docs" disabled onClick={onClick}>
          Documentation
        </Link>
        <Link href="/help">Help center</Link>
      </>,
    );
    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('data-disabled');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(link).not.toHaveAttribute('aria-describedby');
    await userEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
    // Silently disabled: Tab skips it and lands on the next link.
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Help center' })).toHaveFocus();
    await userEvent.hover(link);
    await settle();
    expect(queryTooltip()).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with a disabled reason: disabled, keeps its tab stop, and the reason shows on hover and is read', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <Link
        href="/docs"
        disabledWithReason="Only admins can see the docs"
        onClick={onClick}
      >
        Documentation
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('data-disabled');
    expect(link).not.toHaveAttribute('href');
    // The reason must be reachable by keyboard, so the tab stop stays.
    expect(link).toHaveAttribute('tabindex', '0');
    expect(link).toHaveAccessibleDescription('Only admins can see the docs');
    await userEvent.tab();
    expect(link).toHaveFocus();
    // Focusing it shows the reason, without waiting for a hover.
    expect(await findTooltip()).toHaveTextContent(
      'Only admins can see the docs',
    );
    await userEvent.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.hover(link);
    expect(await findTooltip()).toHaveTextContent(
      'Only admins can see the docs',
    );
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('with a disabled reason: Escape closes the reason tooltip but keeps focus', async () => {
    renderUI(
      <Link href="/docs" disabledWithReason="Only admins can see the docs">
        Documentation
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Documentation' });
    await userEvent.hover(link);
    expect(await findTooltip()).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(queryTooltip()).toBeNull();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('with a disabled reason: clicking it does not follow it, and shows why', async () => {
    const onClick = jest.fn();
    renderUI(
      <Link
        href="/files/attendance-report.pdf"
        download
        disabledWithReason="Ready once the event has ended"
        onClick={onClick}
      >
        Attendance report (PDF)
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Attendance report (PDF)' });
    await userEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
    expect(await findTooltip()).toHaveTextContent(
      'Ready once the event has ended',
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });

  // Stands in for a router's link component, like Next.js's.
  const RouterLink = ({
    to,
    children,
    ...props
  }: ComponentProps<'a'> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  );

  it('asChild: styles its child, which keeps its own href and keyboard behavior', async () => {
    const onClick = jest.fn((event: React.MouseEvent) =>
      event.preventDefault(),
    );
    const { container } = renderUI(
      <Link asChild variant="base">
        <RouterLink to="/docs" onClick={onClick}>
          Documentation
        </RouterLink>
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link).toHaveAttribute('href', '/docs');
    expect(link).toHaveClass(variants.variant.base);
    expect(screen.getAllByRole('link')).toEqual([link]);
    await userEvent.tab();
    expect(link).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("asChild, disabled: an anchor without href, with the child's content, out of the tab order", async () => {
    const { container } = renderUI(
      <Link asChild disabled>
        <RouterLink to="/docs" className={caption}>
          Documentation
        </RouterLink>
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(link).toHaveClass(variants.variant.default, caption);
    await userEvent.tab();
    expect(link).not.toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("asChild, with a disabled reason: keeps its tab stop so the reason is reachable", async () => {
    renderUI(
      <Link asChild disabledWithReason="Only admins can see the docs">
        <RouterLink to="/docs" className={caption}>
          Documentation
        </RouterLink>
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '0');
    expect(link).toHaveClass(variants.variant.default, caption);
    expect(link).toHaveAccessibleDescription('Only admins can see the docs');
    await userEvent.tab();
    expect(link).toHaveFocus();
    await userEvent.hover(link);
    expect(await findTooltip()).toHaveTextContent(
      'Only admins can see the docs',
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
