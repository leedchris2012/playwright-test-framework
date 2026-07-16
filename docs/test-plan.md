# Test Plan: saucedemo.com

## 1. Objective

Define the scope, risk assessment, and test approach for the automated suite in this repo, covering [saucedemo.com](https://www.saucedemo.com) — an intentionally imperfect e-commerce demo site maintained by Sauce Labs. The plan explains *why* coverage is shaped the way it is, not just what's covered.

## 2. Scope

**In scope**
- Authentication (login, logout, access control, session boundaries)
- Product catalog (browsing, images, product detail navigation, sorting)
- Cart (add/remove items, price accuracy, cart contents)
- Checkout (multi-step form validation, order completion, receipt download)
- Visual/UI regression on key pages
- Behavior differences across the four "broken" test accounts (`visual_user`, `problem_user`, `error_user`, `performance_glitch_user`)

**Out of scope** (see [Section 6](#6-out-of-scope--known-gaps) for rationale)
- Load/performance testing beyond a single smoke-level timing assertion
- Accessibility (a11y) testing
- Security testing beyond basic access-control checks (no fuzzing, injection, or auth-bypass testing)
- Network-level mocking / contract testing — all tests run against the live site

## 3. Test Environment

| Item | Detail |
|---|---|
| Application | https://www.saucedemo.com |
| Framework | Playwright + TypeScript |
| Browsers (functional) | Chromium, Firefox, WebKit |
| Browsers (visual/snapshot) | Chromium only — see [Section 6](#6-out-of-scope--known-gaps) |
| Test accounts | `standard_user`, `locked_out_user`, `problem_user`, `performance_glitch_user`, `error_user`, `visual_user` (all `secret_sauce`) |
| Auth strategy | Storage state captured once per account in `tests/setup/auth.setup.ts`, reused across specs to avoid re-logging-in per test |
| CI | GitHub Actions, runs on push; HTML report published as an artifact |

## 4. Risk Assessment

Risk = Likelihood × Impact. This is what drives how much coverage each area gets — checkout has the deepest coverage because it's both revenue-critical and where the account-specific bugs are most severe (BUG-001, BUG-002).

| Area | Likelihood of defect | Impact if broken | Risk | Coverage |
|---|---|---|---|---|
| Checkout flow (form validation, order completion) | Medium | Critical — blocks purchase entirely | **Critical** | `tests/cart/checkout.spec.ts` — happy path, all 3 required-field validations, PDF receipt, plus `error_user` checkout-blocking bug (BUG-001) |
| Cart accuracy (add/remove, price display) | Medium | High — wrong charge or lost sale | **High** | `tests/cart/add-to-cart.spec.ts`, `tests/cart/view-cart.spec.ts`, plus `error_user` partial-add bug (BUG-002) |
| Authentication & access control | Medium | High — unauthorized access or locked-out legitimate users | **High** | `tests/login/login.spec.ts` — valid/invalid/empty-field login, locked-out account, direct-URL access blocking, logout |
| Product catalog integrity (price/image/navigation accuracy) | Medium | High — wrong price or wrong product shown | **High** | `tests/inventory/*.spec.ts`, `tests/filter/sort-dropdown.spec.ts` — covers `visual_user` price bug (BUG-003) and `problem_user` navigation bug (BUG-004) |
| Sorting/filtering | Low | Medium — degrades UX, doesn't block purchase | **Medium** | `tests/filter/sort-dropdown.spec.ts` — all 4 sort orders plus `problem_user` no-op bug (BUG-005) |
| Visual/UI regression | Low | Medium — brand/trust impact, rarely functional | **Medium** | `tests/snapshot/**` — login, inventory, product details, cart, checkout-complete (chromium only) |
| Login performance | Low | Medium — conversion impact if widespread | **Low** (isolated to one demo account) | `tests/login/login.spec.ts` — timing assertion on `performance_glitch_user` (BUG-008); not treated as full performance testing, see Section 6 |

## 5. Test Approach

- **Functional (majority of the suite)**: page-object-modeled specs asserting behavior — form validation, navigation, state changes — run across Chromium, Firefox, and WebKit.
- **Visual regression**: pixel-diff snapshots (`toHaveScreenshot`) on a smaller set of pages where layout correctness matters more than DOM state — chromium-only to avoid the flake and maintenance cost of per-browser baseline images (each engine renders fonts/anti-aliasing slightly differently).
- **Negative/bug-account testing**: rather than only testing `standard_user`, the suite deliberately runs equivalent scenarios against the four broken accounts. This is the core of the risk-based approach here — Sauce Labs ships these accounts specifically to be tested, so the plan treats "does this app degrade the way we expect for a known-broken account" as first-class coverage, not an afterthought.
- **Bug documentation**: every defect found (via exploratory testing — see [`exploratory-charters/`](exploratory-charters/)) gets a written bug report in [`bug-reports/`](bug-reports/) with severity/priority, then a regression test that pins the behavior so it can't silently change.

## 6. Out of Scope / Known Gaps

Documented deliberately rather than left implicit, since an accurate plan says what *isn't* covered and why:

- **Performance/load testing**: only a single timing smoke-check exists (BUG-008). No k6/load-testing tool is used, no concurrent-user simulation, no server-side metrics. Saucedemo is a static demo app so deep load testing has limited value here, but this is the clearest gap if this approach were applied to a real production app.
- **Accessibility**: no automated a11y scanning (e.g. axe-core) is wired in. Given how cheap this is to add to an existing Playwright suite, it's the next-highest-value gap to close.
- **Cross-browser visual coverage**: snapshot tests are chromium-only by design (see Section 5) — visual regressions specific to Firefox/WebKit rendering would not be caught.
- **Security depth**: access-control is checked (direct URL navigation while logged out), but no injection/fuzzing/auth-bypass testing is performed. Reasonable for a demo app; would not be sufficient for a real checkout system handling payment data.
- **Network-level testing**: all tests hit the live site. There's no coverage of how the UI behaves under simulated network failure, slow responses, or malformed API payloads (`page.route()` mocking).

## 7. Entry / Exit Criteria

- **Entry**: `npm ci` succeeds, target environment (saucedemo.com) is reachable, auth setup project runs successfully for the 4 accounts requiring pre-authenticated storage state (`standard_user`, `problem_user`, `visual_user`, `error_user`). `locked_out_user` and `performance_glitch_user` are exercised directly through the login flow in `tests/login/login.spec.ts` and don't need storage state.
- **Exit**: All specs pass on Chromium/Firefox/WebKit (functional) and Chromium (visual), except tests intentionally marked `test.fail()` documenting known open bugs (currently BUG-004). CI is green; HTML report artifact is available for review.
