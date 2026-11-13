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

export const ConfigSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'set it in .env (copy .env.example)'),
  LLM_MODEL: blankable(z.string().default('claude-sonnet-5-5')),
  LLM_MODEL_STRONG: blankable(z.string().default('claude-opus-5-5')),
  LLM_REPLAY: Flag,
  CLAUDE_BIN: blankable(z.string().default('claude')),
  CLAUDE_DOCKER: blankable(Flag),
  CLAUDE_AUTH: blankable(z.enum(['api', 'subscription']).default('api')),
  CLAUDE_CODE_OAUTH_TOKEN: blankable(z.string().optional()),
}).refine((env) => env.CLAUDE_AUTH !== 'subscription' || env.CLAUDE_CODE_OAUTH_TOKEN, {
  path: ['CLAUDE_CODE_OAUTH_TOKEN'],
  message: 'CLAUDE_AUTH=subscription needs it; `claude setup-token` prints one',
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
/** Tests call `loadEnv` directly. */
export const config = () => (cached ??= loadEnv());
