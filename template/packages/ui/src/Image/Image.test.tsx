import { act, fireEvent, screen } from '@testing-library/react';
import { Package } from 'lucide-react';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { Image } from './Image';
import * as styles from './Image.css';

describe('Image', () => {
  it('shows the picture in a box of its size, keeping the caller’s class and attributes', async () => {
    const { container } = renderUI(
      <Image
        src="/photo.png"
        alt="A photo"
        width={400}
        height={300}
        fit="cover"
        className="shrink-0"
        id="cover"
      />,
    );
    const box = container.firstElementChild as HTMLElement;
    expect(box).toHaveClass(styles.box, 'shrink-0');
    expect(box).toHaveAttribute('id', 'cover');
    expect(box.getAttribute('style')).toContain('400px');
    expect(box.getAttribute('style')).toContain('400 / 300');
    const picture = screen.getByRole('img', { name: 'A photo' });
    expect(picture.tagName).toBe('IMG');
    expect(picture).toHaveAttribute('src', '/photo.png');
    expect(picture).toHaveClass('object-cover');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows all of the picture with fit="contain"', () => {
    renderUI(
      <Image src="/logo.png" alt="Logo" width={240} height={120} fit="contain" />,
    );
    expect(screen.getByRole('img', { name: 'Logo' })).toHaveClass(
      'object-contain',
    );
  });

  it('with one side, the picture’s own ratio sets the other', () => {
    const { container } = renderUI(
      <>
        <Image src="/wide.png" alt="Width only" width={400} fit="cover" />
        <Image src="/tall.png" alt="Height only" height={200} fit="cover" />
      </>,
    );
    const [byWidth, byHeight] = Array.from(
      container.children,
    ) as HTMLElement[];
    expect(byWidth!.getAttribute('style')).toContain('400px');
    expect(byWidth!.getAttribute('style')).not.toContain('400 / ');
    expect(screen.getByRole('img', { name: 'Width only' })).toHaveClass(
      'w-full',
      'h-auto',
    );
    expect(byHeight!.getAttribute('style')).toContain('200px');
    expect(byHeight!.getAttribute('style')).toContain('fit-content');
    expect(screen.getByRole('img', { name: 'Height only' })).toHaveClass(
      'h-full',
      'w-auto',
    );
  });

  it('with one side and no picture, the box is square', () => {
    renderUI(
      <>
        <Image alt="Width only" width={120} fit="cover" />
        <Image alt="Height only" height={80} fit="cover" />
      </>,
    );
    const byWidth = screen.getByRole('img', { name: 'Width only' });
    expect(byWidth.getAttribute('style')).toMatch(/120px.*:\s*1(;|$)/);
    const byHeight = screen.getByRole('img', { name: 'Height only' });
    expect(byHeight.getAttribute('style')?.match(/80px/g)).toHaveLength(2);
  });

  it('without src, keeps the box with an icon, named by alt', async () => {
    const { container } = renderUI(
      <Image alt="No photo yet" width={400} height={300} fit="cover" />,
    );
    const box = screen.getByRole('img', { name: 'No photo yet' });
    expect(box.tagName).toBe('DIV');
    expect(box.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('img')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the fallbackIcon in place of a missing picture, sized and colored by the box', () => {
    const { container } = renderUI(
      <Image
        alt="No photo yet"
        width={400}
        height={300}
        fit="cover"
        fallbackIcon={<Package />}
      />,
    );
    const icons = container.querySelectorAll('svg');
    expect(icons).toHaveLength(1);
    expect(icons[0]).toHaveClass('lucide-package', styles.icon);
    expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
  });

  it('leaves a missing picture that only decorates unnamed', () => {
    const { container } = renderUI(
      <Image alt="" width={400} height={300} fit="cover" />,
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('falls back to the icon when the picture fails to load', async () => {
    const { container } = renderUI(
      <Image src="/missing.png" alt="A photo" width={400} height={300} fit="cover" />,
    );
    fireEvent.error(container.querySelector('img')!);
    expect(screen.getByRole('img', { name: 'A photo' }).tagName).toBe('DIV');
    expect(container.querySelector('img')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('falls back to the icon when the picture failed before hydration', async () => {
    // Settled and broken: React never saw the error event.
    jest
      .spyOn(HTMLImageElement.prototype, 'complete', 'get')
      .mockReturnValue(true);
    HTMLImageElement.prototype.decode = () =>
      Promise.reject(new Error('broken'));
    try {
      const { container } = renderUI(
        <Image src="/missing.png" alt="A photo" width={400} height={300} fit="cover" />,
      );
      await act(async () => undefined);
      expect(screen.getByRole('img', { name: 'A photo' }).tagName).toBe('DIV');
      expect(container.querySelector('img')).toBeNull();
    } finally {
      jest.restoreAllMocks();
      // @ts-expect-error jsdom has none; this test adds one.
      delete HTMLImageElement.prototype.decode;
    }
  });

  it('with children, the picture is the background, its alt read before them', async () => {
    const { container } = renderUI(
      <Image src="/backdrop.png" alt="A city at night" width={1200} height={400} fit="cover">
        <p>Over the picture</p>
      </Image>,
    );
    const box = container.firstElementChild as HTMLElement;
    expect(box).toHaveClass(styles.backgrounds.cover);
    expect(box.getAttribute('style')).toContain('url("/backdrop.png")');
    expect(container.querySelector('img')).toBeNull();
    expect(box.textContent).toBe('A city at nightOver the picture');
    expect(screen.getByText('A city at night')).toHaveClass('sr-only');
    expect(await axe(container)).toHaveNoViolations();
  });
});
