# CHARTER-002: Catalog Integrity

**Mission:** Explore the product catalog — inventory listing, images, sorting, and product-details navigation — across test accounts to discover data or rendering inconsistencies, using `standard_user` as the known-good reference point for comparison.

**Areas:** `inventory.html`, `inventory-item.html`

**Duration:** ~60 min, time-boxed

**Test data / accounts:** `standard_user`, `problem_user`, `visual_user`

## Session Notes

- Opened `standard_user` and `problem_user` in two browser windows side by side to eyeball differences directly rather than relying on memory of what "correct" looks like. This paid off immediately: every product tile under `problem_user` showed an identical broken image, where `standard_user` showed 6 distinct photos. → **BUG-006**.
- With `problem_user`, clicked through each product one at a time to check detail-page navigation. Sauce Labs Backpack was the only one that opened the wrong item (Fleece Jacket); the other 5 products navigated correctly. Worth noting this isn't a systemic "all navigation is broken" bug — it's specific to one product, which is a more subtle (and arguably more dangerous, since it wouldn't be caught by "just check if navigation works at all") class of defect. → **BUG-004**.
- Tried all 4 sort options for `problem_user` (name asc/desc, price asc/desc) rather than just one, to see if only some sort modes were broken. All 4 had zero effect on item order — ruled out "only price sort is broken" or similar. → **BUG-005**.
- Switched to `visual_user`. Refreshed the inventory page ~6 times in a row specifically watching prices, since a single load didn't show anything obviously wrong for every item — the bug turned out to be intermittent per-item, not a fixed wrong price. Cross-referenced displayed prices against the real catalog values from `standard_user`'s baseline to confirm mismatches rather than assuming from memory. → **BUG-003**.
- While on `visual_user`, noticed the cart icon looked slightly off-position compared to `standard_user` in the side-by-side window. Used browser dev tools to get exact bounding-box coordinates for both accounts rather than eyeballing it, to have a concrete, reproducible number rather than a subjective "looks off." → **BUG-007**.
- Checked footer social links (Twitter/Facebook/LinkedIn) for `standard_user` — all point to the correct destinations and open in a new tab. No defect found; automated as a straightforward regression check rather than a bug-driven test.
- Tried triggering the broken-image and wrong-navigation bugs together (i.e., does `problem_user`'s broken image also appear on the Fleece Jacket detail page it wrongly navigates to?) — yes, the broken image bug is global to the account and shows on every page, not just the inventory grid. Not written up as a separate bug since it's the same root defect (BUG-006) manifesting on another page, not a new one.

## Bugs Found

- BUG-003 — `visual_user` inventory prices don't match the real catalog (intermittent, per-item)
- BUG-004 — `problem_user` Sauce Labs Backpack opens the wrong product's details page
- BUG-005 — `problem_user` sort dropdown has no effect on item order (all 4 sort modes)
- BUG-006 — `problem_user` shows the same broken image for every product
- BUG-007 — `visual_user` cart icon renders in the wrong header position

## Follow-up

All five written up in `bug-reports/` and automated across `tests/inventory/*.spec.ts` and `tests/filter/sort-dropdown.spec.ts`. BUG-004 specifically used `test.fail()` rather than a normal assertion since it documents a bug still open at the account level (see that bug report for why).
