# Tax Wrapper

Static site. No build step.

```
index.html      Home page
tools.html      Free tools page (TDS interest, invoice, calendar, tax calculator)
invoice.html    Invoice preview page (opens from the invoice generator)
css/style.css   All styling
js/             utils, theme, menu (header dropdowns), tabs, tds, invoice,
                invoice-core (invoice layout, shared), invoice-view (preview page),
                calendar, tax-calculator, consultation
assets/logo.svg
```

- Open `index.html` in a browser, or host the folder on any static host.
- Set your email in `js/utils.js` (`CONTACT`).
- Header menus: edit the lists in the `<header>` of both `index.html` and `tools.html`. Items marked "Soon" have no page yet.
- Tax slabs: `js/tax-calculator.js`. Due dates: `js/calendar.js`.
- Theme toggle: `js/theme.js` (saves the choice in the browser).
