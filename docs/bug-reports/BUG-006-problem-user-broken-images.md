# BUG-006: Every product shows the same broken image

**Account:** `problem_user`
**Date found:** 2026-07-14
**Environment:** https://www.saucedemo.com, Chromium/Firefox/WebKit (functional check), Chromium only (visual snapshot)
**Severity:** Low
**Priority:** P3
**Status:** Won't Fix (intentional demo defect)

## Summary

For the `problem_user` account, every product tile on the inventory page shows the same broken/placeholder image instead of its own distinct product photo. Unlike BUG-003 (price mismatch), this is a pure rendering issue — no data is wrong, nothing is mis-attributed, the images just fail to load correctly and fall back to an identical broken asset.

## Steps to Reproduce

1. Log in as `problem_user` / `secret_sauce`
2. On the inventory page, compare the product image shown for each of the 6 items

## Expected Result

Each product shows its own distinct image (as `standard_user` does).

## Actual Result

All 6 products show the exact same image source — visually and in the underlying `src` attribute.

## Impact

Cosmetic — doesn't block purchase, doesn't mislead the user about price or which product is which (names and prices are still correct), but does hurt visual trust/polish. Rated Low because the product name/price text remains accurate, so a user isn't deceived about what they're buying, just shown an unhelpful picture.

## Automated Coverage

- `tests/inventory/product-images.spec.ts` → `problem_user is served the same broken image for every product` — asserts all image `src` values collapse to a single distinct value (vs. `standard_user`'s test in the same file asserting all sources are distinct)
- `tests/snapshot/inventory/problem-user-visual.spec.ts` → pixel-diff snapshot of the full inventory page, locking in the broken-image appearance so any visual change (fixed or worsened) is caught
