import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
  browser: string;
}

interface Summary {
  PASS: number;
  FAIL: number;
  FLAKY: number;
  'NOT VERIFIED': number;
  'NO TEST IN THIS RUN': number;
  'Unknown requirement IDs': number;
}

interface Report {
  generated: string;
  summary: Summary;
  requirements: RequirementRow[];
  unknownRequirements: UnknownRequirement[];
}

const REQUIREMENTS_FILE = join('docs', 'traceability', 'requirements.json');
const OUTPUT_DIR = join('test-results', 'traceability');

// The terminal result of one TestCase in one browser. A TestCase already
// corresponds to a single test in a single project, so its `results` array holds
// every attempt (including retries) for that browser; the last one is final.
function classify(test: TestCase): PerTestStatus {
  const result = test.results[test.results.length - 1];

  // An expected failure (test.fail) is never a pass, even if it now fails as expected.
  if (test.expectedStatus === 'failed') return 'expected';

  if (!result) return 'skipped';

  if (result.status === 'skipped' || test.expectedStatus === 'skipped') return 'skipped';

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

  onBegin(_config: FullConfig, suite: Suite): void {
    this.rootSuite = suite;
  }

  printsToStdio(): boolean {
    return false;
  }

  onEnd(): void {
    const requirements = JSON.parse(readFileSync(REQUIREMENTS_FILE, 'utf8')) as Requirement[];
    const knownIds = new Set(requirements.map((requirement) => requirement.id));

    const linkedByReq = new Map<string, { test: TestCase; verdict: PerTestStatus }[]>();
    const unknown: UnknownRequirement[] = [];

    for (const test of this.rootSuite?.allTests() ?? []) {
      const browser = test.parent.project()?.name ?? 'unknown';
      for (const annotation of test.annotations) {
        if (annotation.type !== 'requirement' || !annotation.description) continue;
        const id = annotation.description;

        if (!knownIds.has(id)) {
          unknown.push({ id, testTitle: test.title, browser });
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

    const summary: Summary = {
      PASS: 0,
      FAIL: 0,
      FLAKY: 0,
      'NOT VERIFIED': 0,
      'NO TEST IN THIS RUN': 0,
      'Unknown requirement IDs': unknown.length,
    };
    for (const row of rows) summary[row.status] += 1;

    const report: Report = {
      generated: new Date().toISOString(),
      summary,
      requirements: rows,
      unknownRequirements: unknown,
    };

    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(join(OUTPUT_DIR, 'rtm.json'), JSON.stringify(report, null, 2) + '\n');
    writeFileSync(join(OUTPUT_DIR, 'rtm.md'), renderMarkdown(report));
  }
}

function renderMarkdown(report: Report): string {
  const lines: string[] = [];
  lines.push('# Requirement Traceability Matrix');
  lines.push('');
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
      lines.push(`| ${unknown.id} | \`${unknown.testTitle}\` | ${unknown.browser} |`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

export default TraceabilityReporter;
