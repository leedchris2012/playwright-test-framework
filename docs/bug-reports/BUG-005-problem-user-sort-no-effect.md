# BUG-005: Sort dropdown selection doesn't reorder items

**Account:** `problem_user`
**Date found:** 2026-07-14
**Environment:** https://www.saucedemo.com, Chromium/Firefox/WebKit (Playwright)
**Severity:** Medium
**Priority:** P2
**Status:** Won't Fix (intentional demo defect)

## Summary

For the `problem_user` account, selecting any option from the product sort dropdown (Name A–Z, Name Z–A, Price low–high, Price high–low) has no effect — the item order on the inventory page stays the same as the default regardless of which option is selected.

## Steps to Reproduce

1. Log in as `problem_user` / `secret_sauce`
2. On the inventory page, note the default item order
3. Select "Name (Z to A)" from the sort dropdown
4. Observe item order
5. Repeat with the other three sort options (Name A–Z, Price low–high, Price high–low)

## Expected Result

Items reorder to match the selected sort option.

## Actual Result

Item order is unchanged from the default (`az` order) no matter which sort option is selected. The dropdown's own selected value updates correctly — only the underlying list fails to re-render in sorted order.

## Impact

A whole feature (product sorting) is non-functional for this account, but it's a degraded-experience bug, not a blocker — the user can still browse, compare, and purchase items, just not in their preferred order. That's the dividing line between Medium and High/Critical: nothing here prevents completing the core task.

## Automated Coverage

`tests/filter/sort-dropdown.spec.ts` → `problem_user: sorting has no effect on item order`

Selects "Name (Z to A)" and asserts the resulting item order is unchanged from the pre-sort order, in contrast to the passing `standard_user` sort tests in the same file that assert the order does change. This automated check covers one representative sort mode; all four were confirmed broken during exploratory testing (see [CHARTER-002](../exploratory-charters/CHARTER-002-catalog-integrity.md)), but only one is codified as a regression test since all four share the same underlying rendering defect.
