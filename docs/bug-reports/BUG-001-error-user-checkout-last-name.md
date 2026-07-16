# BUG-001: Last Name field on checkout step one rejects all input

**Account:** `error_user`
**Date found:** 2026-07-14
**Environment:** https://www.saucedemo.com, Chromium/Firefox/WebKit (Playwright)
**Severity:** Critical
**Priority:** P1
**Status:** Won't Fix (intentional demo defect)

## Summary

For the `error_user` account, the Last Name field on the checkout information page (`checkout-step-one.html`) does not accept any input — not from `fill()`, not from simulated keystrokes. Since Last Name is a required field, this account can never complete checkout. This is the highest-severity bug in the suite: it doesn't degrade a feature, it fully blocks the core purchase flow with no workaround.

## Steps to Reproduce

1. Log in as `error_user` / `secret_sauce`
2. Add any item to the cart and go to the cart page
3. Click **Checkout**
4. On the checkout information page, fill in First Name
5. Attempt to fill in Last Name, both via direct `fill()` and via simulated keystrokes — observe the field's value after each

## Expected Result

Last Name field accepts and retains typed text.

## Actual Result

The Last Name field's value remains empty regardless of input method. The field is not disabled or marked readonly in the DOM, so this isn't a simple "field is locked" case — the value is silently discarded. Since a separate test in this suite (`checkout step one requires a last name`) confirms an empty Last Name blocks progression to step two, this account can never satisfy that requirement and so can never complete checkout — inferred from that existing validation behavior rather than separately re-verified for `error_user`.

## Impact

Complete loss of the purchase flow for this account. If this were a real production account segment rather than a demo account, this would be a revenue-blocking incident, not a UX papercut.

## Automated Coverage

`tests/cart/checkout.spec.ts` → `error_user: cannot type a last name on checkout step one`

Asserts that both `.fill()` and `pressSequentially()` leave the field empty, confirming the input is rejected rather than just visually unresponsive.
