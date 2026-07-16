# CHARTER-003: Auth & Session Boundaries

**Mission:** Explore login and session boundaries — valid/invalid credentials, locked-out accounts, direct URL access, logout, and login timing — to discover access-control gaps or performance outliers.

**Areas:** login page (`/`), direct navigation to `inventory.html`, logout

**Duration:** ~40 min, time-boxed

**Test data / accounts:** `standard_user`, `locked_out_user`, `performance_glitch_user`, plus invalid/bogus credentials

## Session Notes

- Tried the obvious negative cases first: wrong password, made-up username, both blank. Each produced a distinct, correctly worded error message rather than a generic failure — no bug found here, but confirmed it was worth locking in as regression coverage since three separate error strings is exactly the kind of thing a future copy change could silently break.
- Tested field-level required validation separately (blank username with password filled, blank password with username filled) instead of only testing "both blank," since apps sometimes only validate the first empty field they hit. Both directions surfaced the correct field-specific error. No bug.
- Tried navigating directly to `https://www.saucedemo.com/inventory.html` in a fresh/unauthenticated session (typed URL rather than clicking through) to check the access-control boundary. Got correctly redirected/blocked with an explicit error rather than a blank page or silent redirect — no bug, but this is exactly the kind of check worth automating given it's a security-adjacent boundary rather than routine UX.
- Logged in as `locked_out_user` expecting either a bug or correct-by-design blocking — got the latter, a clear "Epic sadface" lockout message. This is intentional site behavior (demonstrating a locked-account state), not a defect, so it wasn't written up in `bug-reports/` even though it's covered by a test.
- Logged in and out repeatedly as `standard_user` to check the logout path didn't leave any stale session state (e.g. hitting browser back after logout to see if the inventory page was still reachable from cache) — no defect found, but this kind of "did logout actually invalidate access" check is worth doing even when nothing turns up, since it's the highest-value negative case in this whole session.
- Timed `standard_user` login against `performance_glitch_user` login side by side using a stopwatch before writing any automation, specifically to rule out "the whole site is just slow right now" as an explanation — `standard_user` was consistently near-instant while `performance_glitch_user` took ~5 seconds every time. → **BUG-008**.

## Bugs Found

- BUG-008 — `performance_glitch_user` login takes ~5s vs. <100ms baseline

## Follow-up

Most of this session confirmed correct behavior rather than finding bugs — that's a legitimate and expected outcome of exploratory testing, not a wasted session, since it converts assumptions ("direct URL access is probably blocked") into verified, automated facts. All of it is now covered in `tests/login/login.spec.ts`, including the timing check for BUG-008.
