# BUG-009: Product sort dropdown has no accessible name

**Account:** All accounts (structural page markup, not account-specific)
**Date found:** 2026-07-15
**Environment:** https://www.saucedemo.com/inventory.html, Chromium/Firefox/WebKit (Playwright + `@axe-core/playwright`, WCAG 2.0/2.1 A/AA ruleset)
**Severity:** High
**Priority:** P1
**Status:** Fixed upstream (verified 2026-10-15). Originally Won't Fix (third-party site, outside this project's control) — distinct from BUG-001–008: this is a genuine markup defect, not one of Sauce Labs' intentional per-account demo bugs.

## Summary

The product sort control on the inventory page (`<select data-test="product-sort-container">`) has no accessible name — no `<label>`, `aria-label`, `aria-labelledby`, or `title`. Assistive technology (screen readers, voice control) has no way to announce what the control does, so a user relying on AT cannot identify or use the sort feature without guessing or inspecting the page source. This is a real, critical-impact WCAG 2.0 Level A violation (axe rule `select-name`), reproducible on every browser tested, and independent of which account is logged in.

## Steps to Reproduce

1. Log in as any account (e.g. `standard_user` / `secret_sauce`)
2. On the inventory page, run an automated accessibility scan (axe-core, WCAG 2.0/2.1 A/AA tags) or inspect the sort `<select>` with a screen reader
3. Observe the control has no accessible name

## Expected Result

The sort `<select>` should expose an accessible name — e.g. a visually-hidden `<label for="...">` reading something like "Sort products by" — so assistive technology users can identify and operate it.

## Actual Result

axe-core reports a `critical`-impact `select-name` violation: no implicit label, no explicit label, no `aria-label`, no `aria-labelledby`, no `title` attribute, and no `role="presentation"` override. Verified identically on Chromium, Firefox, and WebKit.

## Impact

Users relying on screen readers or other assistive technology cannot reliably discover or use the product sorting feature — a real access barrier, not a cosmetic issue. For a production e-commerce app this would also be a WCAG 2.0 Level A compliance gap, which carries legal risk in many jurisdictions (e.g. ADA Title III, EN 301 549).

## Resolution

- **Date verified:** 2026-10-15
- **How detected:** CI reported `Expected to fail, but passed` on the `test.fail()` test, on Chromium, Firefox, and WebKit.
- **Manual verification:** Chrome DevTools Accessibility pane shows `aria-label="Sort products"` on the `<select>`, computed name "Sort products", role `combobox`.
- **Test change:** `test.fail()` removed. The scan now runs as a regression guard and fails if `select-name` returns.

## Automated Coverage

`tests/accessibility/inventory.spec.ts` → `inventory page has no WCAG 2.0/2.1 A/AA violations`

A normal assertion that acts as a regression guard: if the sort control loses its accessible name again, axe reports `select-name` and the test fails. Until 2026-10-15 it was wrapped in `test.fail()` to document the live bug (the same pattern used for BUG-004); the mark flagged the upstream fix by turning into a failure.
