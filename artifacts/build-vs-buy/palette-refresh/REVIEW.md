# Build vs Buy palette review

The baseline made the recommendation difficult to distinguish from the surrounding white panels. Mint, blue, purple, and orange accents competed with the header's dark green and lemon palette.

The final version uses the existing header tokens: forest `#082c1c`, green `#193e2e`, lemon `#cff07c`, and soft lemon `#f0f8d9`. A dark recommendation banner establishes the main result; white metric cards keep its supporting facts readable. Lemon highlights the recommendation, primary action, and selected route. Supporting cards stay white, and warning colors retain their meaning.

Screenshot review led to a second pass: the remaining purple route icon was corrected, slider colors were aligned, and the mobile photo was subdued to improve text readability.

- [Before, desktop](before-desktop.png)
- [After, desktop](after-desktop.png)
- [After, mobile](after-mobile.png)
- [Responsive verification](after-visual-report.json)
- [Calculator interaction audit](interaction-audit/after-audit.json)

Reviewed at 1920, 1536, 1280, 768, and 390 pixels wide. The sampled layouts have no horizontal overflow or JavaScript page errors. The existing calculator audit passed route recommendations, preference changes, city selection, quote calculations and reset, route exploration, table/cards switching, all detail tabs, source links, CSV export, and mobile layout checks. The production build passed; Vite still reports its existing large-bundle advisory.

Reproduce visual captures with `python artifacts/capture_build_palette.py after` while the app runs on port 5173.
