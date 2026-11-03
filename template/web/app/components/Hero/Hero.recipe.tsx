/**
 * Hero: the landing page's first section. The headline as the page's only
 * H1, the line under it, the main action and the way to sign in, and the
 * preview of the app beside them. It spans the main region on the brand's
 * background, while its content keeps the page's edge.
 *
 * When not to use:
 * - Any page but the landing page: its title is a PageHeader.
 *
 * Pitfalls:
 * - First on the landing page, and only there: it meets the frame's header.
 * - Each action once in the view: when the header offers signing in, the
 *   hero offers signing up alone.
 * - A background of the page's own, such as the brief's signature, goes in a
 *   colocated `.css.ts` passed as `className`; keep all text at 4.5:1 on it.
 */
import { Hero } from '@app/components/Hero';
import { NextLink } from '@app/components/NextLink';
import { Button } from '@packages/ui/Button';
import { Card } from '@packages/ui/Card';
import { Paragraph } from '@packages/ui/Typography';
import React from 'react';

// Usage: the patterns to copy.
/** The headline and its actions, with the preview beside them. */
const WithPreview = () => (
  <Hero
    title="Every book you mean to read, in one quiet list"
    description="Add a book, keep it on a shelf that says where you are with it, and find it again later."
    actions={
      <>
        <Button as={NextLink} href="/sign-up">
          Start your list
        </Button>
        <Button
          as={NextLink}
          href="/sign-in"
          variant="base" // Signing in is the quieter way in, beside signing up.
        >
          Sign in
        </Button>
      </>
    }
    media={
      <Card>
        <h3>The Overstory</h3>
        <Paragraph color="muted">Reading, page 212</Paragraph>
      </Card>
    }
  />
);

/** Text alone, when the preview comes in a section below. */
const TextOnly = () => (
  <Hero
    title="Plan the week your team ships"
    actions={
      <Button as={NextLink} href="/sign-up">
        Plan your first week
      </Button>
    }
  />
);

export default function HeroRecipe() {
  return (
    <div className="flex-col-gap-8">
      <WithPreview />
      <TextOnly />
    </div>
  );
}
