# BUG-008: Login takes ~5s instead of the normal <100ms

**Account:** `performance_glitch_user`
**Date found:** 2026-07-14
**Environment:** https://www.saucedemo.com, Chromium/Firefox/WebKit (Playwright)
**Severity:** Low
**Priority:** P4
**Status:** Won't Fix (intentional demo defect)

## Summary

For the `performance_glitch_user` account, login takes roughly 5+ seconds to resolve, versus well under 100ms for `standard_user` on the same form. The login eventually succeeds and the user reaches the inventory page normally — the only defect is the delay itself.

## Steps to Reproduce

1. Go to the login page
2. Enter `performance_glitch_user` / `secret_sauce`
3. Click **Login** and time how long it takes to reach `inventory.html`
4. Repeat with `standard_user` for comparison

## Expected Result

Login resolves in well under a second, consistent with other accounts.

## Actual Result

Login consistently takes 5+ seconds before redirecting to the inventory page.

## Impact

No functional break — login succeeds and the rest of the session behaves normally. Rated Low/P4 here specifically because it's isolated to one demo account rather than affecting the whole user base; called out separately because a 5s+ delay of this kind is exactly the class of defect that performance/load testing (rather than functional E2E testing) is built to catch, and it's the one bug in this set that a purely functional-correctness suite could just as easily assert away with a longer timeout instead of flagging as a regression.

## Automated Coverage

`tests/login/login.spec.ts` → `performance_glitch_user: login takes noticeably longer than a normal login`

Times the gap between clicking Login and reaching `inventory.html`, asserting it exceeds a 3s threshold — set below the ~5s actual delay for headroom, but well above normal network/render jitter, so the test fails if the delay is ever silently "fixed" (which would mean this account no longer represents the performance-testing scenario it's meant to).
