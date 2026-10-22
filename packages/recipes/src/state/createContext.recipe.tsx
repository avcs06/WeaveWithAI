/**
 * createContext: a context for a component tree, with its provider and hook.
 * For simple, fast values a parent passes down: a group's mode, a list's
 * density. List every key in the defaults: only those update consumers. A
 * value that changes every render (an inline function, a new object) updates
 * them every render, so memoize it, or use a store.
 */
import { createContext } from '@packages/utils/state';

type ListOptions = { density: 'comfortable' | 'compact'; dividers: boolean };

/** An object: the provider takes each key as a prop. */
const [ListOptionsProvider, useListOptions] = createContext<ListOptions>({
  density: 'comfortable',
  dividers: true,
});

const Row = ({ label }: { label: string }) => {
  const { density, dividers } = useListOptions();
  return (
    <li data-density={density} data-dividers={dividers || undefined}>
      {label}
    </li>
  );
};

const CompactList = () => (
  <ListOptionsProvider density="compact" dividers={false}>
    <ul>
      <Row label="Venue" />
      <Row label="Tickets" />
    </ul>
  </ListOptionsProvider>
);

/** Anything else: the provider takes it as `value`. */
const [StepProvider, useStep] = createContext(1);

const StepLabel = () => <p>Step {useStep()}</p>;

const SecondStep = () => (
  <StepProvider value={2}>
    <StepLabel />
  </StepProvider>
);

export default function CreateContextRecipe() {
  return (
    <div>
      <CompactList />
      <SecondStep />
    </div>
  );
}
