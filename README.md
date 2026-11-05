# Tax Wrapper

Static site. No build step.

```
index.html      Home page
tools.html      Free tools page (TDS interest, invoice, calendar, tax calculator)
invoice.html    Invoice preview page (opens from the invoice generator)
login.html      Log in page
dashboard.html  Admin dashboard (add, edit, remove users and their permissions)
masters.html    Saved parties (buyers, sellers, other) per user
invoices.html   Saved invoices: date range, CSV download, admin view/edit/delete
css/style.css   All styling
js/             utils, theme, menu (header dropdowns), tabs, tds, invoice,
                invoice-core (invoice layout, shared), invoice-view (preview page),
                auth (accounts, login, permissions), login, dashboard, perms,
                calendar, tax-calculator, consultation
assets/logo.svg
```

- Open `index.html` in a browser, or host the folder on any static host.
- Set your email in `js/utils.js` (`CONTACT`).
- Header menus: edit the lists in the `<header>` of both `index.html` and `tools.html`. Items marked "Soon" have no page yet.
- Tax slabs: `js/tax-calculator.js`. Due dates: `js/calendar.js`.
- Theme toggle: `js/theme.js` (saves the choice in the browser).

## Login and dashboard

- First account: username `admin`, password `MA`. Change it from the dashboard (Edit, then enter a new password).
- Accounts, the login session and the "Require login" setting are stored in the visitor's browser (localStorage) by `js/auth.js`.
  There is no server, so accounts created on one device do not exist on another, and this is not real security.
  For real accounts, replace the functions in `js/auth.js` (twUsers, twLogin, twUser and so on) with calls to a backend.
- Permissions (TDS interest, invoice, calendar, tax calculator) are listed in `TW_PERMS` in `js/auth.js` and applied in `js/perms.js`.

## Saved invoices and CSV
- Pressing **Preview invoice** while logged in saves a copy under that user (`js/records.js`, localStorage key `tw-invoices`). Logged-out invoices are not saved.
- **Invoices page**: each user sees only their own; admins see everyone's, can filter by user, view, edit (opens the invoice generator) and delete.
- **CSV**: invoice summary or line items, for a From/To date range (by invoice date) with quick ranges. Cells starting with = + - @ are prefixed with ' so spreadsheets do not run them as formulas.
- Everything is stored in the browser, so each browser/device has its own invoices, and privacy is enforced by the page, not a server. For real privacy and cross-device history, store records in a backend database and check the user on the server.

## Save invoice and saved parties
- **Save invoice** (invoice generator) saves a copy to the logged-in user's account and shows a side notification with the invoice number and buyer name. Saving again with the same invoice number updates it.
- **Saved parties** (`masters.html`, `js/masters.js`, store in `js/records.js`, key `tw-masters`): name, category (seller, buyer, other), address, state, pincode, optional GST number and bank details. Each user has their own list and can edit or delete everything in it.
- In the invoice popup, sellers appear only in the Seller picker and buyers only in the Buyer picker; Other is not offered there. A saved seller's bank details print on the invoice as Company's Bank Details.
- Same limits as before: stored in this browser, privacy enforced by the page, not a server.
