# Exploratory Testing Charters

Session-based exploratory charters used to find the defects documented in [`../bug-reports/`](../bug-reports/), following the [SBTM](https://www.satisfice.com/download/session-based-test-management) style: a time-boxed mission, not a scripted procedure. Scripted specs (`tests/`) are good at confirming known behavior stays fixed; they're bad at finding what you didn't think to check. These sessions are where that discovery happened — each one below fed directly into a bug report and, once the bug was confirmed and understood, into a regression test that pins the behavior.

That charter → bug report → automated test pipeline is the point: exploration finds it, a bug report documents it with a severity judgment, automation makes sure it never regresses (or, for still-open bugs, that a fix doesn't go unnoticed — see BUG-004's `test.fail()`).

## Index

| Charter | Mission | Bugs found |
|---|---|---|
| [CHARTER-001](CHARTER-001-checkout-flow.md) | Explore the checkout flow across all test accounts to find validation and completion issues | BUG-001, BUG-002 |
| [CHARTER-002](CHARTER-002-catalog-integrity.md) | Explore product catalog display and navigation across test accounts to find data/rendering inconsistencies | BUG-003, BUG-004, BUG-005, BUG-006, BUG-007 |
| [CHARTER-003](CHARTER-003-auth-boundaries.md) | Explore login and session boundaries to find access-control and performance issues | BUG-008 |
