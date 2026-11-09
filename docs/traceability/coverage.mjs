// Builds docs/traceability/coverage.json by parsing the in-scope spec files for
// their real test titles and validating the requirement -> covered-test mapping
// against those parsed titles. A listed "covered" title that does not exist in
// the parsed output is a hard error, so coverage.json can never claim a mapping
// that the code does not actually contain.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

// Spec files in scope for this traceability drill.
const specFiles = [
  'tests/login/login.spec.ts',
  'tests/cart/checkout.spec.ts',
  'tests/cart/view-cart.spec.ts',
  'tests/cart/add-to-cart-from-details.spec.ts',
  'tests/cart/add-to-cart.spec.ts',
];

// Requirement id -> the exact test titles that cover it. An empty array means the
// requirement is not yet covered.
const requirementCoverage = {
  'REQ-LOGIN-001': ['logs in successfully with standard_user'],
  'REQ-LOGIN-002': ['locked_out_user is blocked with an error message'],
  'REQ-LOGIN-003': ['direct navigation to inventory.html without logging in is blocked'],
  'REQ-LOGIN-004': [],
  'REQ-CHK-001': [
    'checkout step one requires a first name',
    'checkout step one requires a last name',
    'checkout step one requires a postal code',
  ],
  'REQ-CHK-002': ['finishing checkout shows the order confirmation page'],
};

// Extract every test('...') / test("...") title from a file. Handles the title
// being on the same line as `test(` and the multi-line form where the title is
// the first argument. Captures only the quoted first argument.
function extractTestTitles(source) {
  const titles = [];
  const re = /(?:^|\s)test\s*\(\s*(['"])((?:\\.|(?!\1).)*)\1/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    titles.push(m[2]);
  }
  return titles;
}

const parsedTitlesByFile = {};
const allTitles = new Set();
for (const rel of specFiles) {
  const source = readFileSync(join(repoRoot, rel), 'utf8');
  const titles = extractTestTitles(source);
  parsedTitlesByFile[rel] = titles;
  for (const t of titles) allTitles.add(t);
}

// Validate the mapping: every listed covered title must exist in the parsed set.
const errors = [];
for (const [reqId, covered] of Object.entries(requirementCoverage)) {
  for (const title of covered) {
    if (!allTitles.has(title)) {
      errors.push(`${reqId} lists covered title "${title}" but it was not found in the parsed spec files.`);
    }
  }
}
if (errors.length > 0) {
  console.error('Coverage mapping validation FAILED:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

const requirements = Object.entries(requirementCoverage).map(([id, covered]) => ({
  id,
  covered,
}));

const coverage = {
  requirements: requirements,
  generated: new Date().toISOString(),
};

writeFileSync(join(__dirname, 'coverage.json'), JSON.stringify(coverage, null, 2) + '\n');

// Summary.
const total = requirements.length;
const uncovered = requirements.filter((r) => r.covered.length === 0);
const coveredReqs = total - uncovered.length;

console.log(`Parsed ${specFiles.length} spec files; found ${allTitles.size} unique test titles.`);
console.log(`Requirements: ${total} total, ${coveredReqs} covered, ${uncovered.length} uncovered.`);
for (const r of requirements) {
  if (r.covered.length === 0) {
    console.log(`  [UNCOVERED] ${r.id}`);
  } else {
    console.log(`  [covered]   ${r.id} -> ${r.covered.join(' | ')}`);
  }
}
console.log(`Wrote coverage.json with ${requirements.length} requirements.`);
