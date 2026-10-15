import type { AxeResults, Result } from 'axe-core';
import type { TestInfo } from '@playwright/test';

// The 38 WCAG 2.0 Level A and AA success criteria that Section 508 requires.
export const WCAG20_A_AA: readonly string[] = [
  // Level A (25)
  '1.1.1', '1.2.1', '1.2.2', '1.2.3', '1.3.1', '1.3.2', '1.3.3', '1.4.1', '1.4.2',
  '2.1.1', '2.1.2', '2.2.1', '2.2.2', '2.3.1', '2.4.1', '2.4.2', '2.4.3', '2.4.4',
  '3.1.1', '3.2.1', '3.2.2', '3.3.1', '3.3.2', '4.1.1', '4.1.2',
  // Level AA (13)
  '1.2.4', '1.2.5', '1.4.3', '1.4.4', '1.4.5', '2.4.5', '2.4.6', '2.4.7',
  '3.1.2', '3.2.3', '3.2.4', '3.3.3', '3.3.4',
];

export type CoverageStatus = 'violated' | 'incomplete' | 'passed' | 'inapplicable' | 'notChecked';
export type WcagCoverage = Record<CoverageStatus, string[]>;

// A criterion can show up in several axe lists (one rule passes, another is inapplicable),
// so the worst status wins, checked in this order.
const PRECEDENCE: [CoverageStatus, 'violations' | 'incomplete' | 'passes' | 'inapplicable'][] = [
  ['violated', 'violations'],
  ['incomplete', 'incomplete'],
  ['passed', 'passes'],
  ['inapplicable', 'inapplicable'],
];

// axe tags each rule with its success criterion: 'wcag412' -> '4.1.2', 'wcag1410' -> '1.4.10'.
// Level tags like 'wcag2a' or 'wcag21aa' contain letters, so they don't match.
function tagToCriterion(tag: string): string | null {
  const match = /^wcag(\d)(\d)(\d{1,2})$/.exec(tag);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : null;
}

export function wcagCoverage(results: AxeResults): WcagCoverage {
  const statusOf = new Map<string, CoverageStatus>();
  for (const [status, list] of PRECEDENCE) {
    for (const rule of results[list] as Result[]) {
      for (const tag of rule.tags) {
        const criterion = tagToCriterion(tag);
        // Skip criteria outside the 38 (e.g. 2.1.3 is AAA) and ones already given a worse status.
        if (criterion && WCAG20_A_AA.includes(criterion) && !statusOf.has(criterion)) {
          statusOf.set(criterion, status);
        }
      }
    }
  }

  const coverage: WcagCoverage = { violated: [], incomplete: [], passed: [], inapplicable: [], notChecked: [] };
  for (const criterion of WCAG20_A_AA) {
    coverage[statusOf.get(criterion) ?? 'notChecked'].push(criterion);
  }
  return coverage;
}

// Shows the breakdown at the top of the test in the HTML report and attaches it as JSON.
export async function attachWcagCoverage(testInfo: TestInfo, results: AxeResults): Promise<WcagCoverage> {
  const coverage = wcagCoverage(results);
  for (const [status, criteria] of Object.entries(coverage)) {
    testInfo.annotations.push({ type: `WCAG ${status} (${criteria.length})`, description: criteria.join(', ') || 'none' });
  }
  await testInfo.attach('wcag-coverage', { body: JSON.stringify(coverage, null, 2), contentType: 'application/json' });
  return coverage;
}
