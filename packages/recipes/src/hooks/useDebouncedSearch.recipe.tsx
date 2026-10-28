/**
 * useDebouncedSearch: the text of a search field built into a component, as
 * Select's is. Typing shows at once, `onSearch` gets the text after a pause
 * and a cleared search at once; `flush` sends waiting text now, as on Enter.
 * With `search` given, the parent can change the text; `undefined` leaves it
 * to the field. With no `onSearch`, nothing hears it.
 *
 * For a component whose own parts need the typed text before `onSearch` gets
 * it. Not for: a standalone search field, or one whose text only the parent
 * reads (SearchInput, built on this).
 *
 * Pitfall: a parent setting the text it already has changes nothing, even
 * while newer typing waits: "Show all" with `search` already `''` keeps the
 * typed text. Give the component a new `key` to start over.
 */
import { Button } from '@packages/ui/Button';
import { Input } from '@packages/ui/Input';
import { useDebouncedSearch } from '@packages/utils/hooks';
import { Search } from 'lucide-react';
import React, { type KeyboardEvent, useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const sampleLabels = ['Speaker', 'Volunteer', 'Press', 'VIP'];

const matching = (labels: string[], search: string) =>
  labels.filter((label) => label.toLowerCase().includes(search.toLowerCase()));

// Usage: the patterns to copy.
/**
 * A component with search built in: the parent filters the labels by
 * `onSearch`, while Create uses exactly what was typed, without waiting.
 * Enter searches at once.
 */
const LabelPicker = ({
  labels,
  search,
  onSearch,
  onCreate,
}: {
  labels: string[];
  search?: string;
  onSearch?: (text: string) => void;
  onCreate: (label: string) => void;
}) => {
  const [text, setText, flush] = useDebouncedSearch(search, onSearch);
  const label = text.trim();
  const searchOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') flush();
  };

  return (
    <div className="flex-col-gap-2 items-start">
      <Input
        label="Find or create a label"
        autoComplete="off"
        leftIcon={<Search aria-hidden />}
        value={text}
        onChange={setText}
        onKeyDown={searchOnEnter}
      />
      <p role="status">
        {labels.length === 1 ? '1 label' : `${labels.length} labels`}
      </p>
      <ul>
        {labels.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <Button
        variant="base"
        {...(label
          ? {}
          : { disabledWithReason: 'Type a name for the new label' })}
        onClick={() => {
          onCreate(label);
          setText('');
        }}
      >
        {label ? `Create “${label}”` : 'Create label'}
      </Button>
    </div>
  );
};

/** The field keeps its own text; the parent only hears it. */
const OwnText = () => {
  const [labels, setLabels] = useState(sampleLabels);
  const [search, setSearch] = useState('');

  return (
    <LabelPicker
      labels={matching(labels, search)}
      onSearch={setSearch}
      onCreate={(label) => setLabels([...labels, label])}
    />
  );
};

/** The parent sets the text too: "Show all labels" empties the field. */
const ParentText = () => {
  const [labels, setLabels] = useState(sampleLabels);
  const [search, setSearch] = useState('V');

  return (
    <div className="flex-col-gap-2 items-start">
      <LabelPicker
        labels={matching(labels, search)}
        search={search}
        onSearch={setSearch}
        onCreate={(label) => setLabels([...labels, label])}
      />
      <Button variant="base" onClick={() => setSearch('')}>
        Show all labels
      </Button>
    </div>
  );
};

export default function UseDebouncedSearchRecipe() {
  return (
    <div className="flex-col-gap-6">
      <OwnText />
      <ParentText />
    </div>
  );
}
