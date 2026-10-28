import { existsSync } from 'node:fs';
import { z } from 'zod';

// zod 4: `.default()` short-circuits before parsing, so a transformed enum
// needs `.prefault()` for the raw default to go through the transform.
const Flag = z.enum(['true', 'false']).prefault('true').transform((v) => v === 'true');

export const ConfigSchema = z.object({
  MODEL_API_KEY: z.string().min(1, 'set it in .env (copy .env.example)'),
  LLM_BASE_URL: z.url().default('https://api.meta.ai/v1'),
  LLM_MODEL: z.string().default('muse-spark-1.3'),
  LLM_MODEL_STRONG: z.string().default('muse-wonder-1.0'),
  LLM_MODEL_VISION: z.string().default('muse-spark-1.3'),
  LLM_REPLAY: Flag,
});
export type Config = z.infer<typeof ConfigSchema>;

export function loadEnv(options: { file?: string; env?: NodeJS.ProcessEnv } = {}): Config {
  const file = options.file ?? '.env';
  // Node 22+: fills process.env from the file without overriding keys already set.
  if (existsSync(file)) process.loadEnvFile(file);
  const parsed = ConfigSchema.safeParse(options.env ?? process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment:\n${lines.join('\n')}`);
  }
  return parsed.data;
}

let cached: Config | undefined;
/** The process's config, loaded once. Tests call `loadEnv` directly. */
export const config = () => (cached ??= loadEnv());
