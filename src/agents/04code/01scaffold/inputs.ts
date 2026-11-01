import { existsSync, globSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { readArtifact } from '../../../core/artifacts';
import type { Report } from '../../../core/issues';
import { fillPrompt, loadPrompt } from '../../../core/prompt';
import { type Run, runPath } from '../../../core/run';
import { pathBeside } from '../../../core/utils';
import type { Scope } from '../../01flows/01scope/schema';
import { readAnswers } from '../../01flows/answers';
import type { Flows, Question } from '../../01flows/schema';
import type { Themed } from '../../02design/01theme/build';
import type { WidgetScreens } from '../../02design/08assemble/assemble';
import type { Contract } from '../../03contract/schema';
import { CONTRACT, type CodeInputs, FRAMES, type KnownIssue, PAGES, SCAFFOLD, SHARED } from './weave';

/** Each .weave folder and the stage folder whose `prompts/guidelines.md` it gets. */
const GUIDELINES: Record<string, string> = {
  [SCAFFOLD]: '01scaffold',
  [CONTRACT]: '02contract',
  [SHARED]: '03shared',
  [FRAMES]: '04frames',
  [PAGES]: '05pages',
};

function guidelines(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(GUIDELINES).flatMap(([folder, stage]) => {
      const file = pathBeside(import.meta.url, `../${stage}/prompts/guidelines.md`);
      return existsSync(file) ? [[folder, loadPrompt(file)]] : [];
    }),
  );
}

/** What the spec stages left: the mandatory issues and reviewer blockers of each report's last round. */
function knownIssues(run: Run): KnownIssue[] {
  const dir = runPath(run, 'reports');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json') && !file.startsWith('code-'))
    .sort()
    .flatMap((file) => {
      // The browser checks' own `rendered.json` is a list of routes, with no rounds.
      const report = JSON.parse(readFileSync(runPath(run, 'reports', file), 'utf8')) as Partial<Report>;
      const last = report.rounds?.at(-1)?.issues ?? [];
      return last.filter((issue) => issue.severity === 'mandatory').map((issue) => ({ ...issue, stage: file.slice(0, -5) }));
    });
}

/** The first paragraph of a recipe's leading comment: what it is and when it fits. */
function recipeLine(file: string): string {
  const doc = readFileSync(file, 'utf8').match(/^\/\*\*([\s\S]*?)\*\//)?.[1] ?? '';
  const lines = doc.split('\n').map((line) => line.replace(/^\s*\* ?/, '').trimEnd());
  const first = lines.join('\n').trim().split(/\n\s*\n/)[0] ?? '';
  return first.replace(/\s+/g, ' ').trim();
}

/** `.weave/01-scaffold/recipes.md`: every recipe of the app's packages/recipes by name, with what it is for. */
function recipeIndex(appDir: string): string {
  const files = globSync('packages/recipes/src/**/*.recipe.tsx', { cwd: appDir }).sort();
  const lines = files.map((file) => {
    const name = path.basename(file, '.recipe.tsx');
    // Most headers open with their own name; the index already gives it.
    return `- \`${name}\`: ${recipeLine(path.join(appDir, file)).replace(new RegExp(`^${name}: `), '')}`;
  });
  return fillPrompt(loadPrompt(pathBeside(import.meta.url, './prompts/recipes.md')), { recipes: lines.join('\n') || 'None.' });
}

/** The run's artifacts, answers and known issues, as the .weave folders need them. */
export function readCodeInputs(run: Run): CodeInputs {
  const scope = readArtifact<Scope>(run, 'flows-scope').data;
  const flows = readArtifact<Flows>(run, 'flows-reconcile').data;
  const design = readArtifact<WidgetScreens>(run, 'design-assemble').data;
  const answers = readAnswers(run);
  const asked = (from: string, questions: Question[]) =>
    questions.map((q) => ({ id: q.id, question: q.question, answer: answers[q.id]?.answer ?? q.defaultAnswer, from }));
  return {
    scope,
    flows,
    design,
    themed: readArtifact<Themed>(run, 'design-theme').data,
    contract: readArtifact<Contract>(run, 'contract').data,
    questions: [...asked('scope', scope.questions), ...asked('flows', flows.questions), ...asked('design', design.questions)],
    known: knownIssues(run),
    guidelines: guidelines(),
    recipes: recipeIndex(runPath(run, 'app')),
  };
}
