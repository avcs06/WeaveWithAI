/**
 * PageHeader: the top of every page, the same everywhere. The breadcrumb to
 * the pages above, the title as the page's only H1, a muted description, and
 * the page's actions at the end of the title's row.
 *
 * When not to use:
 * - The landing page: its hero's headline is the H1.
 * - A part of the page with its own title: a Section, whose heading comes
 *   after the page's.
 *
 * Pitfalls:
 * - One per page, first in it. The frame around it already holds the app's
 *   logo and navigation; don't repeat them here.
 * - The breadcrumb lists the pages above, from the top. The page itself is
 *   the title, not a crumb. A top-level page has no breadcrumb.
 * - `actions` are the page's own, like Add or Export. Actions on one record
 *   stay with that record.
 */
import { PageHeader } from '@app/components/PageHeader';
import { Button } from '@packages/ui/Button';
import { Plus } from 'lucide-react';
import React from 'react';

// Usage: the patterns to copy.
/** A top-level page: its title alone. */
const TitleOnly = () => <PageHeader title="Reports" />;

/** A list page: what it holds, and the action that adds to it. */
const WithActions = () => (
  <PageHeader
    title="Projects"
    description="Everything your team is working on"
    actions={<Button leftIcon={<Plus />}>New project</Button>}
  />
);

/** A record's page: the breadcrumb leads back up to its list. */
const WithBreadcrumb = () => (
  <PageHeader
    title="Quarterly review"
    breadcrumb={[{ label: 'Projects', href: '/projects' }]}
    actions={<Button>Edit</Button>}
  />
);

export default function PageHeaderRecipe() {
  return (
    <div className="flex-col-gap-8">
      <TitleOnly />
      <WithActions />
      <WithBreadcrumb />
    </div>
  );
}
