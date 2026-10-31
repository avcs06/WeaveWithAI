import { existsSync } from 'node:fs';
import { z } from 'zod';

// zod 4: `.default()` short-circuits before parsing, so a transformed enum
// needs `.prefault()` for the raw default to go through the transform.
const Flag = z
  .enum(['true', 'false'])
  .prefault('true')
  .transform((v) => v === 'true');
// .env.example lists every variable, so an unused one arrives as '' and must count as unset.
const blankToUndefined = (value: unknown) => (value === '' ? undefined : value);
const blankable = <S extends z.ZodType>(schema: S) =>
  z.preprocess(blankToUndefined, schema);
const Optional = blankable(z.string().optional());
const OptionalUrl = blankable(z.url().optional());
const BackendName = blankable(
  z.enum(['meta', 'modal', 'baseten']).default('meta'),
);

export const ConfigSchema = z.object({
  MODEL_API_KEY: z.string().min(1, 'set it in .env (copy .env.example)'),
  LLM_BASE_URL: z.url().default('https://api.meta.ai/v1'),
  LLM_MODEL: z.string().default('muse-spark-1.3'),
  LLM_MODEL_STRONG: z.string().default('muse-wonder-1.0'),
  LLM_MODEL_VISION: z.string().default('muse-spark-1.3'),
  LLM_REPLAY: Flag,
  LLM_BACKEND: BackendName,
  MODAL_BASE_URL: OptionalUrl,
  MODAL_PROXY_TOKEN: Optional,
  MODAL_MODEL: Optional,
  BASETEN_BASE_URL: blankable(
    z.url().default('https://inference.baseten.co/v1'),
  ),
  BASETEN_API_KEY: Optional,
  BASETEN_MODEL: Optional,
});
export type Config = z.infer<typeof ConfigSchema>;

export function loadEnv(
  options: { file?: string; env?: NodeJS.ProcessEnv } = {},
): Config {
  const file = options.file ?? '.env';
  // Node 22+: fills process.env from the file without overriding keys already set.
  if (existsSync(file)) process.loadEnvFile(file);
  const parsed = ConfigSchema.safeParse(options.env ?? process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map(
      (i) => `  ${i.path.join('.')}: ${i.message}`,
    );
    throw new Error(`Invalid environment:\n${lines.join('\n')}`);
  }
  return parsed.data;
}

let cached: Config | undefined;
/** The process's config, loaded once. Tests call `loadEnv` directly. */
export const config = () => (cached ??= loadEnv());
