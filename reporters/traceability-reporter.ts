import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { Reporter, FullConfig, Suite, TestCase } from '@playwright/test/reporter';

interface Requirement {
  id: string;
  description: string;
}

type PerTestStatus = 'passed' | 'flaky' | 'failed' | 'skipped' | 'expected';
type RequirementStatus = 'PASS' | 'FAIL' | 'FLAKY' | 'NOT VERIFIED' | 'NO TEST IN THIS RUN';

interface LinkedTest {
  title: string;
  browser: string;
  status: string;
  attempts: number;
}

interface RequirementRow {
  id: string;
  description: string;
  status: RequirementStatus;
  linkedTests: LinkedTest[];
}

interface UnknownRequirement {
  id: string;
  testTitle: string;
  browsers: string[];
}

interface Summary {
  PASS: number;
  FAIL: number;
  FLAKY: number;
  'NOT VERIFIED': number;
  'NO TEST IN THIS RUN': number;
  'Unknown requirement IDs': number;
}

type RunScope = 'COMPLETE' | 'PARTIAL';

interface RunDetails {
  commit: string;
  baseUrl: string;
  playwrightVersion: string;
  ranBrowsers: string[];
  unrunBrowsers: string[];
  scope: RunScope;
  reasons: string[];
}

interface Report {
  generated: string;
  summary: Summary;
  requirements: RequirementRow[];
  unknownRequirements: UnknownRequirement[];
  runDetails: RunDetails;
}

function commitSha(): string {
  try {
    return execSync('git rev-parse HEAD', {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
  } catch {
    return 'unknown';
  }
}

function playwrightVersion(): string {
  try {
    const require = createRequire(join(process.cwd(), 'package.json'));
    const pkg = require('playwright/package.json') as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function grepArg(argv: string[]): string | undefined {
  return argv.find(
    (arg) =>
      arg.startsWith('--grep') ||
      arg === '-g' ||
      arg === '-gv' ||
      arg.startsWith('-g=') ||
      arg.startsWith('-gv='),
  );
}

const REQUIREMENTS_FILE = join('docs', 'traceability', 'requirements.json');
const OUTPUT_DIR = join('test-results', 'traceability');

// The terminal result of one TestCase in one browser. A TestCase already
// corresponds to a single test in a single project, so its `results` array holds
// every attempt (including retries) for that browser; the last one is final.
function classify(test: TestCase): PerTestStatus {
  const result = test.results[test.results.length - 1];

  if (!result) return 'skipped';

  if (result.status === 'skipped' || test.expectedStatus === 'skipped') return 'skipped';

  if (test.expectedStatus === 'failed') return result.status === 'failed' ? 'expected' : 'failed';

  if (result.status === 'failed' || result.status === 'timedOut' || result.status === 'interrupted') {
    return 'failed';
  }

  // Passed: flaky if an earlier attempt in this browser did not pass.
  const passedAfterRetry = test.results.some(
    (r, i) =>
      i < test.results.length - 1 &&
      (r.status === 'failed' || r.status === 'timedOut' || r.status === 'interrupted'),
  );
  return passedAfterRetry ? 'flaky' : 'passed';
}

function overallStatus(verdicts: PerTestStatus[]): RequirementStatus {
  if (verdicts.length === 0) return 'NO TEST IN THIS RUN';
  if (verdicts.includes('failed')) return 'FAIL';
  if (verdicts.includes('flaky')) return 'FLAKY';
  if (verdicts.includes('skipped') || verdicts.includes('expected')) return 'NOT VERIFIED';
  return 'PASS';
}

class TraceabilityReporter implements Reporter {
  private rootSuite?: Suite;
  private config?: FullConfig;

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.rootSuite = suite;
  }

  printsToStdio(): boolean {
    return false;
  }

  onEnd(): void {
    const requirements = JSON.parse(readFileSync(REQUIREMENTS_FILE, 'utf8')) as Requirement[];
    const knownIds = new Set(requirements.map((requirement) => requirement.id));

    const linkedByReq = new Map<string, { test: TestCase; verdict: PerTestStatus }[]>();
    const unknown = new Map<string, UnknownRequirement>();

    for (const test of this.rootSuite?.allTests() ?? []) {
      const browser = test.parent.project()?.name ?? 'unknown';
      for (const annotation of test.annotations) {
        if (annotation.type !== 'requirement') continue;
        const id = annotation.description?.trim() ? annotation.description : '(empty)';

        if (!knownIds.has(id)) {
          const key = `${id}::${test.title}`;
          const entry =
            unknown.get(key) ?? { id, testTitle: test.title, browsers: [] };
          if (!entry.browsers.includes(browser)) entry.browsers.push(browser);
          unknown.set(key, entry);
          continue;
        }

        const verdict = classify(test);
        const linked = linkedByReq.get(id) ?? [];
        linked.push({ test, verdict });
        linkedByReq.set(id, linked);
      }
    }

    const rows: RequirementRow[] = requirements.map((requirement) => {
      const linked = linkedByReq.get(requirement.id) ?? [];
      const verdicts = linked.map((entry) => entry.verdict);
      const linkedTests: LinkedTest[] = linked.map(({ test, verdict }) => {
        return {
          title: test.title,
          browser: test.parent.project()?.name ?? 'unknown',
          status: verdict,
          attempts: test.results.length,
        };
      });
      return {
        id: requirement.id,
        description: requirement.description,
        status: overallStatus(verdicts),
        linkedTests,
      };
    });

    const unknownRequirements = [...unknown.values()];

    const summary: Summary = {
      PASS: 0,
      FAIL: 0,
      FLAKY: 0,
      'NOT VERIFIED': 0,
      'NO TEST IN THIS RUN': 0,
      'Unknown requirement IDs': unknownRequirements.length,
    };
    for (const row of rows) summary[row.status] += 1;

    const runDetails = buildRunDetails(this.config, this.rootSuite);

    const report: Report = {
      generated: new Date().toISOString(),
      summary,
      requirements: rows,
      unknownRequirements,
      runDetails,
    };

    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(join(OUTPUT_DIR, 'rtm.json'), JSON.stringify(report, null, 2) + '\n');
    writeFileSync(join(OUTPUT_DIR, 'rtm.md'), renderMarkdown(report));
  }
}

function buildRunDetails(config: FullConfig | undefined, suite: Suite | undefined): RunDetails {
  const argv = config?.argv ?? [];
  const configured = (config?.projects ?? [])
    .filter((project) => project.name !== 'setup')
    .map((project) => project.name);

  const ranBrowsers: string[] = [];
  for (const test of suite?.allTests() ?? []) {
    if (test.results.length === 0) continue;
    const browser = test.parent.project()?.name;
    if (!browser || browser === 'setup') continue;
    if (!ranBrowsers.includes(browser)) ranBrowsers.push(browser);
  }

  const unrunBrowsers = configured.filter((browser) => !ranBrowsers.includes(browser));

  const reasons: string[] = [];
  if (unrunBrowsers.length > 0) reasons.push(`Configured browsers not run: ${unrunBrowsers.join(', ')}`);
  if (config?.shard) reasons.push(`Shard ${config.shard.current} of ${config.shard.total}`);
  const grep = grepArg(argv);
  if (grep) reasons.push(`Grep filter ${grep}`);

  return {
    commit: commitSha(),
    baseUrl: config?.projects?.[0]?.use.baseURL ?? 'unknown',
    playwrightVersion: playwrightVersion(),
    ranBrowsers,
    unrunBrowsers,
    scope: reasons.length === 0 ? 'COMPLETE' : 'PARTIAL',
    reasons,
  };
}

function renderMarkdown(report: Report): string {
  const lines: string[] = [];
  lines.push('# Requirement Traceability Matrix');
  lines.push('');
  if (report.runDetails.scope === 'PARTIAL') {
    lines.push('Partial run: PASS covers only the tests in this run.');
    lines.push('');
  }
  lines.push(`Generated: ${report.generated}`);
  lines.push('');

  lines.push('## Summary');
  lines.push(`- PASS: ${report.summary.PASS}`);
  lines.push(`- FAIL: ${report.summary.FAIL}`);
  lines.push(`- FLAKY: ${report.summary.FLAKY}`);
  lines.push(`- NOT VERIFIED: ${report.summary['NOT VERIFIED']}`);
  lines.push(`- NO TEST IN THIS RUN: ${report.summary['NO TEST IN THIS RUN']}`);
  lines.push(`- Unknown requirement IDs: ${report.summary['Unknown requirement IDs']}`);
  lines.push('');

  lines.push('## Requirements');
  lines.push('| Requirement | Description | Linked Tests (browser: result) | Status |');
  lines.push('| --- | --- | --- | --- |');
  for (const row of report.requirements) {
    const cell =
      row.linkedTests.length === 0
        ? '_no linked tests_'
        : row.linkedTests
            .map((linked) => {
              const attempts =
                linked.attempts > 1 ? ` (${linked.attempts} attempts)` : ' (1 attempt)';
              return `\`${linked.title}\` — ${linked.browser}: ${linked.status}${attempts}`;
            })
            .join('<br>');
    lines.push(`| ${row.id} | ${row.description} | ${cell} | ${row.status} |`);
  }
  lines.push('');

  lines.push('## Unknown Requirement IDs');
  if (report.unknownRequirements.length === 0) {
    lines.push('(none)');
  } else {
    lines.push('| Requirement ID | Test Title | Browser |');
    lines.push('| --- | --- | --- |');
    for (const unknown of report.unknownRequirements) {
      lines.push(`| ${unknown.id} | \`${unknown.testTitle}\` | ${unknown.browsers.join(', ')} |`);
    }
  }
  lines.push('');

  const run = report.runDetails;
  lines.push('## Run details');
  lines.push(`- Commit: ${run.commit}`);
  lines.push(`- Base URL: ${run.baseUrl}`);
  lines.push(`- Playwright version: ${run.playwrightVersion}`);
  lines.push(`- Browsers ran: ${run.ranBrowsers.join(', ')}`);
  lines.push(`- Browsers configured but not run: ${run.unrunBrowsers.join(', ') || '(none)'}`);
  lines.push(`- Run scope: ${run.scope}`);
  if (run.reasons.length > 0) {
    lines.push('');
    lines.push('Reasons for partial run:');
    for (const reason of run.reasons) lines.push(`- ${reason}`);
  }
  lines.push('');

  return lines.join('\n');
}

export default TraceabilityReporter;
