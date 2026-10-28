/**
 * Attributes a component sets itself from its own props: typed `never` so a
 * caller can't set them again. Omitting them isn't enough: JSX accepts any
 * undeclared attribute with a dash in its name.
 */
export type SetByComponent<Key extends string> = { [Name in Key]?: never };

/** A name for an element with no visible text of its own to be named by. */
export type AccessibleName =
  | { 'aria-label': string }
  | { 'aria-labelledby': string };
