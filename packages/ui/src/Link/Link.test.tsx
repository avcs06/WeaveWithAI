import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type ComponentProps } from 'react';

import { caption } from '../StoryStyles.css';
import { axe, renderUI } from '../test-utils';

import { NextLink } from './auxiliary';
import { Link } from './Link';
import { linkRecipe } from './Link.recipes.css';

const { variants } = linkRecipe.classNames;

describe('Link', () => {
  it('is a link to its href, reachable by keyboard', async () => {
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
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('applies the variant', () => {
    renderUI(
      <>
        <Link href="/a">Default</Link>
        <Link href="/b" variant="base">
          Base
        </Link>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Default' })).toHaveClass(
      variants.variant.default,
    );
    expect(screen.getByRole('link', { name: 'Base' })).toHaveClass(
      variants.variant.base,
    );
  });

  it('when disabled: no href, ignores clicks and leaves the tab order', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <Link href="/docs" disabled onClick={onClick}>
        Documentation
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('data-disabled');
    expect(link).toHaveAttribute('tabindex', '-1');
    await userEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(link).not.toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with a disabled reason: disabled, and the reason shows on hover', async () => {
    renderUI(
      <Link href="/docs" disabledWithReason="Only admins can see the docs">
        Documentation
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).not.toHaveAttribute('href');
    await userEvent.hover(link);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Only admins can see the docs',
    );
    expect(link).toHaveAccessibleDescription('Only admins can see the docs');
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

  it('asChild: styles its child, which keeps its own href', async () => {
    const { container } = renderUI(
      <Link asChild variant="base">
        <RouterLink to="/docs">Documentation</RouterLink>
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link).toHaveAttribute('href', '/docs');
    expect(link).toHaveClass(variants.variant.base);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("asChild, disabled: an anchor without href, with the child's content", async () => {
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
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(link).toHaveClass(variants.variant.default, caption);
    await userEvent.hover(link);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Only admins can see the docs',
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('when enabled: a plain anchor, with no disabled attributes', () => {
    renderUI(<Link href="/docs">Documentation</Link>);
    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link).not.toHaveAttribute('aria-disabled');
    expect(link).not.toHaveAttribute('role');
  });
});

describe('NextLink', () => {
  it('is a Next.js link to its href, styled as Link', async () => {
    const { container } = renderUI(
      <>
        <NextLink href="/events">Events</NextLink>
        <Link href="/events">Plain</Link>
      </>,
    );
    const link = screen.getByRole('link', { name: 'Events' });
    expect(link).toHaveAttribute('href', '/events');
    expect(link.className).toBe(
      screen.getByRole('link', { name: 'Plain' }).className,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('takes an href object, as Next.js does', () => {
    renderUI(
      <NextLink href={{ pathname: '/events', query: { page: '2' } }}>
        Events
      </NextLink>,
    );
    expect(screen.getByRole('link', { name: 'Events' })).toHaveAttribute(
      'href',
      '/events?page=2',
    );
  });

  it('passes anchor props and its click handler to the anchor', async () => {
    const onClick = jest.fn((event: React.MouseEvent) =>
      event.preventDefault(),
    );
    renderUI(
      <NextLink href="/events" target="_blank" onClick={onClick}>
        Events
      </NextLink>,
    );
    const link = screen.getByRole('link', { name: 'Events' });
    expect(link).toHaveAttribute('target', '_blank');
    await userEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('when disabled: no href, ignores clicks and leaves the tab order', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <NextLink href="/events" disabled onClick={onClick}>
        Events
      </NextLink>,
    );
    const link = screen.getByRole('link', { name: 'Events' });
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    await userEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with a disabled reason: shows it on hover', async () => {
    renderUI(
      <NextLink
        href="/reports"
        disabledWithReason="Opens once the event has ended"
      >
        Attendance report
      </NextLink>,
    );
    const link = screen.getByRole('link', { name: 'Attendance report' });
    await userEvent.hover(link);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Opens once the event has ended',
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
