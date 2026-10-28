import {
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useReducer,
  useRef,
} from 'react';

import { useConfigSyncContext } from './configSync';

/** One owner render: config components add their ids as they render. */
type OrderPass = {
  ids: string[];
  has: (id: string) => boolean;
  /** Adds `id` while this pass's render is in progress; ignored after. */
  collect: (id: string) => void;
  /** Open until the provider's layout effect commits the order. */
  isOpen: () => boolean;
  close: () => void;
  /** Renders the provider again, so every config component collects again. */
  refresh: () => void;
};

const createOrderPass = (refresh: () => void): OrderPass => {
  const ids: string[] = [];
  // Beside the array, so a lookup doesn't scan every id of a long list.
  const seen = new Set<string>();
  let open = true;
  return {
    ids,
    has: (id) => seen.has(id),
    collect: (id) => {
      if (!open || seen.has(id)) return;
      seen.add(id);
      ids.push(id);
    },
    isOpen: () => open,
    close: () => {
      open = false;
    },
    refresh,
  };
};

const ConfigOrderContext = createContext<OrderPass | null>(null);

/**
 * Renders after every config component, so the pass holds all their ids.
 * While the owner mounts, content after the provider reads the order during
 * render, before any effect: so the order is written here, once.
 */
const PassEnd = ({ onEnd }: { onEnd: () => void }) => {
  'use no memo'; // Runs on every render, by design.
  onEnd();
  return null;
};

/**
 * Collects config components in render order: each render hands them a new
 * pass, so each one, wrappers included, re-renders and adds its id in tree
 * order. Goes inside `ConfigSyncProvider`, before the content that reads the
 * order.
 */
export const ConfigOrderProvider = ({
  onOrder,
  children,
}: {
  /** Receives the ids in order: once on mount, then when the order changes. */
  onOrder: (ids: string[]) => void;
  children: ReactNode;
}) => {
  'use no memo'; // A new order pass on every render is the point.
  const { mounted } = useConfigSyncContext();
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const writtenRef = useRef<string[] | null>(null);

  const pass = createOrderPass(refresh);

  const write = () => {
    pass.close();
    const written = writtenRef.current;
    const isSame =
      written?.length === pass.ids.length &&
      written.every((id, index) => id === pass.ids[index]);
    if (isSame) return;
    writtenRef.current = pass.ids;
    onOrder(pass.ids);
  };

  // Runs after the config components' effects. While the owner mounts,
  // PassEnd has written the order already.
  useLayoutEffect(() => {
    if (mounted) write();
    else pass.close();
  });

  return (
    <ConfigOrderContext value={pass}>
      {children}
      {/* A config component that renders after it collects again, as after
          mount. */}
      {!mounted && <PassEnd onEnd={write} />}
    </ConfigOrderContext>
  );
};

/** Places a config component in its owner's order by its `id`. */
export const useConfigOrder = (id: string) => {
  const pass = useContext(ConfigOrderContext);
  if (!pass) throw new Error('useConfigOrder needs a ConfigOrderProvider');
  pass.collect(id);

  useLayoutEffect(() => {
    // Rendered with the owner: the provider commits the order next.
    if (pass.isOpen()) return;
    // Mounted or re-id'd in a render the owner wasn't part of, e.g. in a
    // wrapper that re-rendered alone: collect the order again.
    if (!pass.has(id)) pass.refresh();
  }, [pass, id]);
};
