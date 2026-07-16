# BUG-004: Clicking one product opens a different product's details page

**Account:** `problem_user`
**Date found:** 2026-07-14
**Environment:** https://www.saucedemo.com, Chromium/Firefox/WebKit (Playwright)
**Severity:** Medium
**Priority:** P2
**Status:** Won't Fix (intentional demo defect)

## Summary

For the `problem_user` account, clicking on "Sauce Labs Backpack" (either the product image or the product name link) navigates to the product details page for a *different* product — "Sauce Labs Fleece Jacket" — instead of the Backpack's own page.

## Steps to Reproduce

1. Log in as `problem_user` / `secret_sauce`
2. On the inventory page, click the "Sauce Labs Backpack" product name (or its image)
3. Observe the product name and price shown on the resulting details page

## Expected Result

Details page loads for "Sauce Labs Backpack" with matching name and price.

## Actual Result

Details page loads for "Sauce Labs Fleece Jacket" — wrong product, wrong price, while the URL still shows an `inventory-item.html?id=...` pattern consistent with successful navigation. There's no error state; the user is simply shown the wrong item.

## Impact

Medium rather than High: the user isn't blocked, and it's very likely to be caught immediately since the visible name/price don't match what was clicked. Still a real defect — a customer could buy the wrong item, or lose trust in the catalog, especially at higher traffic where users click quickly and skim.

## Automated Coverage

`tests/inventory/product-details.spec.ts` → `problem_user: clicking Sauce Labs Backpack opens the wrong product details page`

Note: this test is wrapped in `test.fail()` rather than a normal assertion, because it documents a currently-true bug. If the underlying bug is ever fixed, `test.fail()` flips the result to a suite failure — that's a deliberate signal, not test rot, so this bug report and BUG-004's "open" status should be revisited if that ever happens.
