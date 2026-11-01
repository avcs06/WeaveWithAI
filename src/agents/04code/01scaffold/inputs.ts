import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { readArtifact } from '../../../core/artifacts';
import type { Report } from '../../../core/issues';
import { loadPrompt } from '../../../core/prompt';
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
      const report = JSON.parse(readFileSync(runPath(run, 'reports', file), 'utf8')) as Report;
      const last = report.rounds.at(-1)?.issues ?? [];
      return last.filter((issue) => issue.severity === 'mandatory').map((issue) => ({ ...issue, stage: file.slice(0, -5) }));
    });
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
  };
}
