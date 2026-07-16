# Bug Reports

Nine defects found while testing [saucedemo.com](https://www.saucedemo.com), written up the way I'd file them on a real project. The first eight are tied to specific login accounts (`visual_user`, `problem_user`, `error_user`, `performance_glitch_user`) that Sauce Labs ships with intentional bugs baked in, so those are marked **Won't Fix (intentional demo defect)**. BUG-009 is different: a real, account-independent accessibility markup defect found via automated `axe-core` scanning, marked **Won't Fix (third-party site)** since it's still outside this project's control to fix, but it isn't one of Sauce Labs' deliberate demo bugs. The point of this folder isn't to get them fixed; it's to show the reasoning: severity vs. priority, repro steps, expected vs. actual, and a link to the automated regression test that pins the behavior.

Each bug report also cross-references the Playwright spec and test name that catches it, so you can see the report and the automation that codifies it side by side.

## Severity & Priority

Rated independently, the way I'd rate them on a real e-commerce app rather than by how they look on screen — a wrong price is "just a visual" the same way a snake is "just a rope."

**Severity** — how badly the defect breaks the product if left alone:
- **Critical** — core flow (e.g. checkout) cannot be completed, no workaround
- **High** — major function broken or produces wrong data with no visible error
- **Medium** — a feature is impaired but the user can still complete their task
- **Low** — cosmetic; doesn't block or mislead the user in a way that affects outcome

**Priority** — how urgently it should be fixed, given severity and business impact:
- **P1** — fix before next release
- **P2** — fix soon, not release-blocking
- **P3** — fix when convenient
- **P4** — backlog / nice-to-have

## Index

| ID | Account | Summary | Severity | Priority | Status |
|----|---------|---------|----------|----------|--------|
| [BUG-001](BUG-001-error-user-checkout-last-name.md) | error_user | Last Name field on checkout rejects all input | Critical | P1 | Won't Fix (demo) |
| [BUG-002](BUG-002-error-user-add-to-cart.md) | error_user | 3 of 6 items silently fail to add to cart | High | P1 | Won't Fix (demo) |
| [BUG-003](BUG-003-visual-user-price-mismatch.md) | visual_user | Inventory prices are randomized, don't match catalog | High | P1 | Won't Fix (demo) |
| [BUG-004](BUG-004-problem-user-wrong-product-details.md) | problem_user | Clicking one product opens a different product's details page | Medium | P2 | Won't Fix (demo) |
| [BUG-005](BUG-005-problem-user-sort-no-effect.md) | problem_user | Sort dropdown selection doesn't reorder items | Medium | P2 | Won't Fix (demo) |
| [BUG-006](BUG-006-problem-user-broken-images.md) | problem_user | Every product shows the same broken image | Low | P3 | Won't Fix (demo) |
| [BUG-007](BUG-007-visual-user-cart-icon-position.md) | visual_user | Cart icon renders in the wrong position in the header | Low | P3 | Won't Fix (demo) |
| [BUG-008](BUG-008-performance-glitch-user-slow-login.md) | performance_glitch_user | Login takes ~5s instead of the normal <100ms | Low | P4 | Won't Fix (demo) |
| [BUG-009](BUG-009-inventory-sort-dropdown-no-accessible-name.md) | all accounts | Product sort dropdown has no accessible name (WCAG 2.0 A) | High | P1 | Won't Fix (3rd-party) |
