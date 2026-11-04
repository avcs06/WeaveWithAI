import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { warmUp } from './server';

// A server that answers 500 for its first `failing` requests, as Next does
// while it compiles a route for the first time, then 200.
let server: Server;
let base = '';
let failing = 0;
let requests = 0;

beforeAll(async () => {
  server = createServer((_req, res) => {
    requests += 1;
    res.writeHead(requests <= failing ? 500 : 200).end();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server.close());

describe('warming the dev server up', () => {
  it('waits out the 5xx of a first compile and goes on at the first other answer', async () => {
    requests = 0;
    failing = 2;
    await warmUp(`${base}/`);
    expect(requests).toBe(3);
  });

  it('gives up on a 5xx that lasts, so the checks report it', async () => {
    requests = 0;
    failing = 1000;
    await warmUp(`${base}/`, 1_000);
    expect(requests).toBeGreaterThanOrEqual(2);
    expect(requests).toBeLessThan(10);
  });
});
