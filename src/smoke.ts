import { parseArgs } from 'node:util';
import { z } from 'zod';
import { loadEnv } from './core/env';
import { createLlm, ModelRequestFailed } from './core/llm';

// Step 08 adds --backend here.
parseArgs({ options: {} });

const Shape = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('circle'), radius: z.number() }),
  z.object({ kind: z.literal('rect'), width: z.number(), height: z.number() }),
]);
const Toy = z.object({
  title: z.string(),
  mode: z.enum(['draft', 'final']),
  tags: z.array(z.string()),
  items: z.array(z.object({ name: z.string(), qty: z.number().int(), note: z.string().nullable() })),
  shape: Shape,
});

const config = { ...loadEnv(), LLM_REPLAY: false };
const llm = createLlm({ config });

try {
  const result = await llm.generateStructured({
    stage: 'smoke',
    round: 1,
    schema: Toy,
    schemaName: 'Toy',
    messages: [
      { role: 'system', content: 'Return a small realistic example object that matches the schema.' },
      { role: 'user', content: 'A toy inventory for a corner shop.' },
    ],
  });
  console.log(JSON.stringify(result.data, null, 2));
  console.log(
    `${result.backend}/${result.model}: ${result.usage.input} in, ${result.usage.output} out, $${result.costUsd.toFixed(5)}, ${result.durationMs} ms`,
  );
} catch (error) {
  const status = error instanceof ModelRequestFailed && error.status ? ` (HTTP ${error.status})` : '';
  console.error(`${error instanceof Error ? error.message : String(error)}${status}`);
  process.exitCode = 1;
}
