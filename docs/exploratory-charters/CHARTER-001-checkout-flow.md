# CHARTER-001: Checkout Flow

**Mission:** Explore the checkout flow (cart → checkout info → overview → complete) across all test accounts to discover validation gaps or completion failures, using the cart and checkout forms as the attack surface.

**Areas:** `cart.html`, `checkout-step-one.html`, `checkout-step-two.html`, `checkout-complete.html`

**Duration:** ~45 min, time-boxed

**Test data / accounts:** `standard_user`, `problem_user`, `error_user`, `visual_user`

## Session Notes

- Ran the full happy-path checkout as `standard_user` first to establish a baseline: add item → cart → fill first/last name + postal code → overview shows correct item total → Finish → confirmation page. Baseline behaves correctly.
- Tried submitting checkout-step-one with each of the three fields empty individually (rather than just "all empty") to see if error messages were generic or field-specific. They're field-specific ("Last Name is required" vs "Postal Code is required"), which is a positive finding, not a bug — worth locking in as a passing test regardless.
- Switched to `error_user` and repeated the same form-filling sequence used for `standard_user`. First Name accepted normally. Last Name field visually behaved like input was accepted (cursor moved, no error shown) but the field showed empty on the next glance. Re-tried with `.fill()` equivalent (paste) and with slow deliberate typing — same result both ways. This ruled out "field is just visually laggy" and confirmed a real input-rejection bug → **BUG-001**.
- With `error_user`, before finding BUG-001, tried adding all 6 inventory items rather than just one, since a broken account felt like a good candidate for hitting inventory-count edge cases. Cart badge stalled at 3 despite clicking all 6 "Add to cart" buttons, with zero visible error or toast. Re-ran from a fresh login to rule out leftover cart state — same result. → **BUG-002**.
- Checked whether `error_user`'s cart bug affected checkout total math for the 3 items that *did* add — it didn't; the item total, tax, and total for those 3 items were all correct. So the bug is isolated to the add action, not downstream pricing logic.
- Tried the PDF receipt download link on the confirmation page as a `standard_user` — file downloads with a dated filename matching the current date. No issue found here, but worth automating since a stale/wrong date on a receipt would be a real customer-facing defect if it regressed.
- Spot-checked `problem_user` and `visual_user` through checkout as a sanity pass — no checkout-specific defects found for either (their bugs live in the catalog, not checkout).

## Bugs Found

- BUG-001 — `error_user` Last Name field rejects all input, blocking checkout entirely
- BUG-002 — `error_user` silently fails to add 3 of 6 items to cart

## Follow-up

Both bugs written up in `bug-reports/`, then automated in `tests/cart/checkout.spec.ts` and `tests/cart/add-to-cart.spec.ts` respectively so the exact repro (fill vs. keystroke input for BUG-001; all-6-items-clicked for BUG-002) is preserved as a regression check, not just a one-time observation.
