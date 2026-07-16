# BUG-003: Inventory prices are randomized, don't match catalog

**Account:** `visual_user`
**Date found:** 2026-07-14
**Environment:** https://www.saucedemo.com, Chromium (Playwright)
**Severity:** High
**Priority:** P1
**Status:** Won't Fix (intentional demo defect)

## Summary

For the `visual_user` account, item prices shown on the inventory page are randomized on every page load instead of reflecting the real catalog prices. This is rated High rather than Low/cosmetic: displaying an incorrect price is a data-integrity and trust issue, not a rendering glitch — a customer could add an item expecting one price and be charged another, which in a real store could be a legal/compliance problem (e.g. false advertising) as well as a support/chargeback cost.

## Steps to Reproduce

1. Log in as `visual_user` / `secret_sauce`
2. On the inventory page, note the price shown for each item
3. Reload the page
4. Compare displayed prices against the known-correct catalog prices (e.g. Sauce Labs Backpack = $29.99, Sauce Labs Bike Light = $9.99, etc.)

## Expected Result

Displayed prices match the real catalog price for every item, consistently across reloads.

## Actual Result

At least one item's displayed price differs from its real catalog price on a given load. Unlike the cart icon bug (BUG-007), the specific mismatched item(s) and the incorrect values are not consistent between reloads — the price appears to be randomized rather than pinned to a fixed wrong value.

## Impact

Highest-impact bug in the "visual" category. If shipped to production, this could result in customers being shown (and potentially charged) incorrect prices, with real financial and legal exposure — worth flagging that severity should be judged by consequence, not by which UI layer the bug lives in.

## Automated Coverage

`tests/inventory/visual-user-bugs.spec.ts` → `visual_user: inventory prices do not match the real catalog prices`

Compares each displayed price against a hard-coded table of correct catalog prices and asserts at least one mismatch occurs. Because the wrong values are randomized per load, the test checks for *any* mismatch rather than a specific wrong price.
