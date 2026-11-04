import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/** One file the generator changed in an app, with who changed it. */
type LedgerEntry = { path: string; status: string; origin: 'code' | 'model'; session?: string; stage?: string };

/** Appends to the app's `.weave/ledger.json`, the record of every file the generator wrote. */
export function appendLedger(appDir: string, entries: LedgerEntry[]): void {
  const file = path.join(appDir, '.weave', 'ledger.json');
  mkdirSync(path.dirname(file), { recursive: true });
  const ledger = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as LedgerEntry[]) : [];
  ledger.push(...entries);
  writeFileSync(file, `${JSON.stringify(ledger, null, 2)}\n`);
}
