# Tax Wrapper

Static site for e-commerce sellers (Myntra, Flipkart, Amazon, Shopify, Meesho). No build step: open `index.html` or host the folder on any static host (GitHub Pages works).

## Folder structure

```
index.html                  Home page (the only page at the root)
assets/                     Shared by every feature. Nothing feature-specific lives here.
  css/    base.css          Theme variables, layout, header, footer, buttons
          components.css    Shared components (cards, forms, modals, tables)
  js/     utils.js          Helpers ($, esc, fmt, iso...), TW_PAGES, CONTACT. Always loads first.
          theme.js          Light/dark switch
          menu.js           Header dropdowns and mobile menu
          snack.js          Side notifications
          zip.js            ZIP writer/reader (resizer, bulk import)
          spreadsheet.js    xlsx/csv reader and writer (bulk import)
  images/ logo.svg
features/                   One folder per feature. Each holds its own html, css and js.
scripts/new_feature.py      Creates and registers a new feature folder
```

### Features

| Folder | What it is | Files |
|---|---|---|
| `home` | Home page styles and the "Why sellers choose" slider under the hero | home.css, hero-slider.css/.js, faq.css/.js |
| `tools` | Tools page with tabs (TDS, Invoice, Calendar, Tax calculator) | tools.html, tools.css, tabs.js |
| `tds-interest` | TDS interest calculator | tds.js |
| `tax-calculator` | Income tax calculator, slabs live here | tax-calculator.js |
| `tax-calendar` | Due dates calendar | calendar.js, calendar.css |
| `consultation` | Book a call form | consultation.js |
| `invoice` | Invoice generator popup and preview page | invoice.html, invoice.js, invoice-core.js, invoice-view.js, invoice.css |
| `invoice-bulk-import` | Excel/CSV bulk invoice import | bulk-import.js, bulk-import.css |
| `saved-invoices` | Saved invoices, CSV download, admin view | invoices.html, invoices.js, invoice-store.js |
| `saved-parties` | Saved buyers/sellers/other | masters.html, masters.js, party-store.js |
| `auth` | Accounts, login, permissions | auth.js, login.html, login.js, perms.js, auth.css |
| `admin-dashboard` | Admin manages users and permissions | dashboard.html, dashboard.js |
| `image-resizer` | Marketplace Image Resizer | image-resizer.html, .js, .css |
| `hsn-lookup` | HSN code validator, keyword search, source links | hsn-lookup.html, .js, .css, hsn-data.js |

## Rules that keep it tidy

- A feature's own code stays inside its folder. Code used by two or more features goes in `assets/`.
- Each page has `<html data-root="...">`, the path back to the site root (`""` for index, `"../../"` for pages in `features/x/`). Use `twPage('key')` (from `TW_PAGES` in `assets/js/utils.js`) to link pages from scripts.
- Scripts are classic (not modules) and share globals, so load order matters: `utils.js`, `../auth/auth.js`, `theme.js`, `menu.js`, then the feature's scripts. `perms.js` loads last on pages that use it.
- Each feature adds its own CSS after `base.css` and `components.css`. Scope selectors under a feature class so styles do not leak.
- The header is repeated in every page's HTML (only link prefixes differ). When you add a menu link, add it to all 9 pages' headers.

## Adding a new feature

1. `python3 scripts/new_feature.py gst-rate-finder "GST Rate Finder"`
   Creates `features/gst-rate-finder/` with a clean page (shared header, footer, scripts), an empty `.css` and `.js`, and registers `twPage('gst-rate-finder')` in `assets/js/utils.js`.
2. Build the feature inside that folder. Prefix element ids (for example `grf-`).
3. Add a menu link in the `<header>` of the pages that should show it.
4. Store data in localStorage under a `tw-` key, per user when private.
5. Test at 320px and 1920px, in light and dark mode.

## Storage keys

`tw-theme`, `tw-session`, `tw-users`, `tw-config`, `tw-invoices`, `tw-masters`, `tw-rz-presets` (localStorage); `tw-invoice`, `tw-rz` (sessionStorage).

## Notes per feature

- **Settings**: contact email is `CONTACT` in `assets/js/utils.js`. Theme saves the choice in the browser.
- **Login**: first account `admin` / `MA`; change it from the dashboard. Accounts, session and the "Require login" setting are in the browser (localStorage), so they do not exist on other devices and this is not real security. For real accounts, replace the functions in `features/auth/auth.js` with backend calls. Permissions (`TW_PERMS` in auth.js) are applied by `features/auth/perms.js`.
- **Saved invoices**: Preview or Save invoice stores a copy under the logged-in user (`tw-invoices`). Users see only their own; admins see all. CSV export by date range; cells starting with = + - @ are prefixed with ' to avoid formula injection. Privacy is enforced by the page, not a server.
- **Saved parties**: name, category (seller, buyer, other), address, state, pincode, optional GST and bank details (`tw-masters`). Sellers show only in the Seller picker, buyers only in the Buyer picker.
- **Bulk import**: Tools, Invoice tab, "Bulk import". Download the template, one row per item (same Invoice No becomes one invoice), check the result table, then save.
- **Home slider**: markup is the `<section class="why">` in `index.html` (3 slides, edit the text there). Auto-advances every 5.5s, pauses on hover/focus, supports dots, swipe and arrow keys, and respects reduced motion.
- **Home FAQ**: the `<section class="faq">` in `index.html`. Add a question by copying one `.fq-i` block and giving its button and answer new matching ids. One answer is open at a time.
- **HSN lookup**: checks digits (2/4/6/8), chapter (01-99 except 77), SAC (99) and a built-in list of common headings (`hsn-data.js`, edit to extend). Browsers cannot read Google or the GST portal from another site, so it opens Google and the GST portal in new tabs. Real 6/8-digit and rate checks need a backend that calls an HSN API.
- **Image resizer**: runs fully in the browser (canvas); images are never uploaded. Presets (`PRESETS` at the top of `image-resizer.js`): Myntra 1080x1440, Flipkart 1000x1000. ZIP is built by `assets/js/zip.js`.
- **Screen sizes**: from 280px up. From 1700px the page scales up (1.15x, 1.4x from 2200px, 1.9x from 3000px). Light/dark fades over about 0.45s unless reduced motion is on.
