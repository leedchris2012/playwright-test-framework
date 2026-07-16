# BUG-007: Cart icon renders in the wrong position in the header

**Account:** `visual_user`
**Date found:** 2026-07-14
**Environment:** https://www.saucedemo.com, Chromium (Playwright)
**Severity:** Low
**Priority:** P3
**Status:** Won't Fix (intentional demo defect)

## Summary

For the `visual_user` account, the shopping cart icon in the page header renders shifted from its normal position. For `standard_user` it sits at roughly `{x: 1220, y: 10}`; for `visual_user` it renders around `{x: 1034, y: 39}` — noticeably left and down from where it should be. The icon is still clickable and functional; only its position is wrong.

## Steps to Reproduce

1. Log in as `visual_user` / `secret_sauce`
2. On the inventory page, inspect the bounding box position of the cart icon in the header
3. Compare against the position for `standard_user` on the same page

## Expected Result

Cart icon renders in the same header position regardless of account, consistent with `standard_user`.

## Actual Result

Cart icon is offset roughly 186px left and 29px down from the correct position. Reproducible consistently across repeat loads (unlike the price bug, BUG-003, which varies per load).

## Impact

Purely cosmetic. The icon remains clickable and cart functionality is unaffected — this is a layout/CSS defect, not a functional one, which is why it's rated Low despite being immediately visible.

## Automated Coverage

`tests/inventory/visual-user-bugs.spec.ts` → `visual_user: cart icon renders in the wrong position`

Reads the cart icon's bounding box and asserts it falls outside a tolerance window around the known-correct `standard_user` position, rather than pinning to one exact wrong coordinate (kept loose enough to avoid flaking on minor rendering variance while still catching the real displacement).
