import { z } from 'zod';
import { loadPrompt } from '../core/prompt';
import { pathBeside } from '../core/utils';

/** A document's keyed lists: each top-level array a fix may patch, by the property that names its items (`flows` by `id`). */
export type PatchKeys = Record<string, string>;

type Item = Record<string, unknown>;
type ListPatch = { upsert: Item[]; remove: string[] };

/** How a patch is written, for every prompt that asks for one. */
export const patchFormat = loadPrompt(
  pathBeside(import.meta.url, './prompt-patch.md'),
);

/** What a fix returns for a document with keyed lists: per list the complete items that change or are new and the keys to remove; any other field null when it stays. */
export function patchSchema(schema: z.ZodType, keys: PatchKeys): z.ZodObject {
  if (!(schema instanceof z.ZodObject))
    throw new Error('a patch needs an object schema');
  const fields = schema.shape as Record<string, z.ZodType>;
  for (const field of Object.keys(keys))
    if (!(field in fields)) throw new Error(`no list ${field} to patch`);
  const shape: Record<string, z.ZodType> = {};
  for (const [field, value] of Object.entries(fields)) {
    const key = keys[field];
    if (!key) {
      shape[field] = value
        .nullable()
        .describe('null when it stays as it is, or its whole new value');
      continue;
    }
    if (!(value instanceof z.ZodArray))
      throw new Error(`${field} is keyed but not a list`);
    shape[field] = z.object({
      upsert: z
        .array(value.element as z.ZodType)
        .describe(`Complete items; the same ${key} replaces, a new one adds`),
      remove: z.array(z.string()).describe(`The ${key} of each item to delete`),
    });
  }
  return z.object(shape);
}

/**
 * An updated item, keeping every list the update sends empty that the item
 * had filled: a model that means "unchanged" sends [], and
 * a filled list emptied by a fix is never what the fix was for.
 */
function kept(item: Item, update: Item): Item {
  const next = { ...update };
  for (const [field, value] of Object.entries(update))
    if (Array.isArray(value) && value.length === 0 && Array.isArray(item[field]) && (item[field] as unknown[]).length > 0)
      next[field] = item[field];
  return next;
}

/** The patch merged into the document: a changed item replaces the one with its key in place, a new key goes at the end, a removed key goes; a field that is not null replaces its value. */
export function applyPatch<T extends object>(
  current: T,
  patch: Record<string, unknown>,
  keys: PatchKeys,
): T {
  const next = { ...current } as Record<string, unknown>;
  for (const [field, value] of Object.entries(patch)) {
    const key = keys[field];
    if (!key) {
      if (value !== null) next[field] = value;
      continue;
    }
    const { upsert, remove } = value as ListPatch;
    const keyOf = (item: Item) => String(item[key]);
    const changed = new Map(upsert.map((item) => [keyOf(item), item]));
    const removed = new Set(remove);
    const list = (next[field] ?? []) as Item[];
    const known = new Set(list.map(keyOf));
    next[field] = [
      ...list.map((item) => {
        const update = changed.get(keyOf(item));
        return update ? kept(item, update) : item;
      }),
      ...upsert.filter((item) => !known.has(keyOf(item))),
    ].filter((item) => !removed.has(keyOf(item)));
  }
  return next as T;
}
