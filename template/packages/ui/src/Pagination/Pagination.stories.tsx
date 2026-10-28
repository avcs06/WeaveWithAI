import React, { useState } from 'react';

import { Checkbox } from '../Checkbox';
import { StoryPage, StorySection } from '../StoryLayout';
import { caption, mutedText } from '../StoryStyles.css';

import { Pagination, type PaginationValue } from '.';

import type { Meta, StoryObj } from '@storybook/react-vite';

export default { title: 'UI/Pagination' } satisfies Meta;
// The page renders its own paginations, so the story takes no args.
type Story = StoryObj;

const sessionName = ['session', 'sessions'] as const;

const PaginationStories = () => {
  const [minimal, setMinimal] = useState(false);
  const [icons, setIcons] = useState(false);
  const [info, setInfo] = useState(true);
  const [itemName, setItemName] = useState(true);
  const [filtered, setFiltered] = useState(false);
  const [selected, setSelected] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [reason, setReason] = useState(false);
  const [fewItems, setFewItems] = useState(false);
  const [page, setPage] = useState<PaginationValue>({
    pageIndex: 0,
    pageSize: 10,
  });

  const totalItems = fewItems ? 4 : filtered ? 37 : 95;

  return (
    <StoryPage>
      <p className={`${caption} ${mutedText}`}>
        A navigation landmark named by `label`. Tab moves through the page-size
        select and the buttons; the current page has `aria-current`, and the
        info line announces each new range.
      </p>

      <StorySection title="Sizes and content">
        <Pagination label="Full with text pagination" totalItems={95} />
        <Pagination
          label="Full with icons pagination"
          totalItems={95}
          content="icons"
        />
        <Pagination
          label="Minimal with text pagination"
          totalItems={95}
          size="minimal"
        />
        <Pagination
          label="Minimal with icons pagination"
          totalItems={95}
          size="minimal"
          content="icons"
        />
      </StorySection>

      <StorySection title="Info">
        <Pagination
          label="Filtered pagination"
          totalItems={37}
          itemName={sessionName}
          filtered
          unfilteredTotal={95}
          selectedCount={3}
        />
        <Pagination label="Empty pagination" totalItems={0} />
        <Pagination
          label="Without info pagination"
          totalItems={95}
          showInfo={false}
        />
      </StorySection>

      <StorySection title="Features">
        <div className="flex-row-gap-4 flex-wrap">
          <Checkbox checked={minimal} onCheckedChange={setMinimal}>
            Size: minimal
          </Checkbox>
          <Checkbox checked={icons} onCheckedChange={setIcons}>
            Content: icons
          </Checkbox>
          <Checkbox checked={info} onCheckedChange={setInfo}>
            Info
          </Checkbox>
          <Checkbox checked={itemName} onCheckedChange={setItemName}>
            itemName: sessions
          </Checkbox>
          <Checkbox checked={filtered} onCheckedChange={setFiltered}>
            Filtered
          </Checkbox>
          <Checkbox checked={selected} onCheckedChange={setSelected}>
            Selected count
          </Checkbox>
          <Checkbox checked={disabled} onCheckedChange={setDisabled}>
            Disabled
          </Checkbox>
          <Checkbox checked={reason} onCheckedChange={setReason}>
            Disabled reason
          </Checkbox>
          <Checkbox checked={fewItems} onCheckedChange={setFewItems}>
            One page
          </Checkbox>
        </div>
        <p className={`${caption} ${mutedText}`}>
          value: page {page.pageIndex + 1}, {page.pageSize} per page
        </p>
        <Pagination
          label="Sessions pagination"
          totalItems={totalItems}
          value={page}
          onChange={setPage}
          size={minimal ? 'minimal' : 'full'}
          content={icons ? 'icons' : 'text'}
          showInfo={info}
          itemName={itemName ? sessionName : undefined}
          filtered={filtered}
          unfilteredTotal={filtered ? 95 : undefined}
          selectedCount={selected ? 3 : undefined}
          // A reason replaces plain `disabled`: they can't be set together.
          {...(reason
            ? { disabledWithReason: 'Loading the page' }
            : { disabled })}
        />
      </StorySection>
    </StoryPage>
  );
};

export const Overview: Story = { render: () => <PaginationStories /> };
