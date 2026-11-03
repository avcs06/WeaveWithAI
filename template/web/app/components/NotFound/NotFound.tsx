import { Button } from '@packages/ui/Button';
import React from 'react';

import { NextLink } from '../NextLink';
import { PageHeader } from '../PageHeader';

import type { NotFoundProps } from './NotFound.types';

/**
 * What a record's page shows when its id finds nothing, the same on every
 * page: a title naming what is missing, one line, and the way back to the
 * list.
 */
export const NotFound = ({ title, description, back }: NotFoundProps) => (
  <div className="flex-col-gap-4 items-start">
    <PageHeader title={title} description={description} />
    <Button as={NextLink} href={back.href}>
      {back.label}
    </Button>
  </div>
);
