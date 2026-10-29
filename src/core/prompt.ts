import { readFileSync } from 'node:fs';

const PLACEHOLDER = /\{\{(\w+)\}\}/g;

/** Reads a prompt or idea `.md`; the HTML comments hold notes for us, not the model. */
export function loadPrompt(file: string): string {
  return stripComments(readFileSync(file, 'utf8'));
}

export function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '').trim();
}

export function fillPrompt(
  template: string,
  values: Record<string, string>,
): string {
  const names = new Set(
    [...template.matchAll(PLACEHOLDER)].map((match) => match[1] as string),
  );
  const missing = [...names].filter((name) => !(name in values));
  if (missing.length > 0)
    throw new Error(`Prompt is missing values for: ${missing.join(', ')}`);
  const unused = Object.keys(values).filter((key) => !names.has(key));
  if (unused.length > 0)
    throw new Error(`Prompt has no placeholder for: ${unused.join(', ')}`);
  return template.replace(
    PLACEHOLDER,
    (_, name: string) => values[name] as string,
  );
}
