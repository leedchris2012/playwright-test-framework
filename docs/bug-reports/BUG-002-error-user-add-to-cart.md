# BUG-002: 3 of 6 items silently fail to add to cart

**Account:** `error_user`
**Date found:** 2026-07-14
**Environment:** https://www.saucedemo.com, Chromium/Firefox/WebKit (Playwright)
**Severity:** High
**Priority:** P1
**Status:** Won't Fix (intentional demo defect)

## Summary

For the `error_user` account, clicking "Add to cart" on 3 of the 6 inventory items (Sauce Labs Bolt T-Shirt, Sauce Labs Fleece Jacket, Test.allTheThings() T-Shirt (Red)) has no effect — the button stays labeled "Add to cart" instead of switching to "Remove," and the item never reaches the cart. The other 3 items work normally. No error message is shown, so the failure is invisible unless you're specifically checking the cart contents against what you clicked.

## Steps to Reproduce

1. Log in as `error_user` / `secret_sauce`
2. On the inventory page, click "Add to cart" on all 6 items in order
3. Check the cart badge count
4. Check which items have a "Remove" button vs. still show "Add to cart"

## Expected Result

Cart badge shows "6." All six "Add to cart" buttons switch to "Remove."

## Actual Result

Cart badge caps at "3." Three specific items (Bolt T-Shirt, Fleece Jacket, Test.allTheThings() T-Shirt) never add — their buttons never change state and no error is surfaced to the user.

## Impact

Silent partial failure on a core commerce action. A user could reasonably believe all 6 items were added, proceed to checkout, and be charged for only 3 — a trust and revenue issue, made worse by the total absence of any error feedback.

## Automated Coverage

`tests/cart/add-to-cart.spec.ts` → `error_user: cannot add all items to the cart`

Adds all 6 items, asserts cart badge reads "3," and asserts Remove buttons are present only for the 3 items that actually succeeded.
