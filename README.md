# SagiSolar Trip Companion

[Open the live app](https://sagisolar-trip-companion.antoinette-w-0270.chatgpt.site)


Mobile-responsive trucking trip estimator with local fuel-statement import.

## Working features

- Load cost estimates include empty miles, fuel consumption, maintenance, driver pay, daily overhead, tolls, trip fees and percentage deductions.
- Break-even and target load pay account for percentage deductions.
- Reusable truck settings, saved estimates and CSV export.
- CSV/TSV fuel statement import with column mapping, explicit USD/US gallon confirmation, review, duplicate detection and invalid-row reporting.
- Imported fuel purchase totals and weighted paid fuel price; purchases can be assigned to saved estimates.
- Final payment, consumed fuel cost and other final costs can be entered to compare final earnings with the estimate.
- Fuel-stop comparison includes manually entered discounts, eligible refundable taxes and detour cost.

## Data boundaries

This package contains no customer trip history, account credentials or private repository history. `dist/history.json` is intentionally empty. Fuel statements are parsed in the browser; only selected fields are retained in browser localStorage. Raw statement data, unmapped columns and card numbers are not intentionally saved or uploaded. Users should not map card numbers to transaction IDs. Local data is not encrypted and is scoped to the browser, not to an individual signed-in driver. Do not use this edition on shared devices for separate driver accounts without a proper authenticated storage backend.

The source is ready for a **new** public GitHub repository. Do not copy the private deployment repository's `.git` directory, `.openai` directory, workbook or historical data. No license is granted by this README; the owner should choose a license before inviting outside reuse.

## Run

Serve the `dist` directory with any static web server (for example, `python -m http.server 8000 --directory dist`) and open its local address. No package install or build is required. For GitHub Pages, deploy the contents of `dist` as the static artifact. GitHub Pages can host this browser-local edition; it cannot hold private provider API secrets.

## Test

Run `node tests/trip-math.test.cjs`, `node tests/fuel-core.test.cjs` and syntax checks with `node --check dist/app.js` and `node --check dist/connections.js`.

## Not yet connected

No fuel provider API, live fuel prices, truck routing, toll API, automatic background refresh, cloud driver accounts or bank account connection is implemented. Selecting a fuel provider records a preference only. It does not connect an account. CSV import works without those integrations.

Direct syncing requires the selected provider's supported API, commercial access if required, authentication documentation and approved credentials. Implement it in a secure backend, not in this static bundle. Do not collect drivers' provider passwords in browser forms or commit secrets to GitHub.

For a multi-driver release, add authenticated per-driver storage, server-side authorization on each request, secure provider credential storage, scoped provider authorization, disconnect/revocation, transaction pagination and idempotency, provider-specific currency/unit mapping, last-successful-sync timestamps and visible error states. Routing must account for truck dimensions, weight and restrictions. Transaction access does not imply access to current discounted station prices.

## Calculation limits

Historical paid prices are not current quotes. Fuel purchased on a trip may be consumed on other trips. Purchase totals therefore remain separate from consumed fuel cost and final profit. Imported diesel totals must exclude non-fuel items and separate fees. Only positive USD/US gallon diesel purchases are supported; credits and other currencies need separate reconciliation. No IFTA settlement, income tax or unentered cost is included. Estimates are only as complete as the input profile.

## Rate confirmation uploads

PDF, JPEG, PNG and WebP rate confirmations can be attached to estimates. Files are validated by signature, limited to 10 MB each and 50 MB total, and stored in IndexedDB on the current browser. They are not sent to a server. Users can open/download originals, review suggested fields, link to a saved estimate or delete a document. Removing a document detaches it without deleting the estimate. Reusing a historical trip does not carry its rate confirmation onto a different load.

Text PDF extraction uses vendored Mozilla PDF.js 5.6.205 (Apache-2.0; license in dist/vendor/pdfjs-LICENSE), reading at most 20 pages and 100,000 characters. Simple labeled fields are suggested; competing values are left blank. Review is required before applying fields. Scanned PDFs and images require manual detail entry; OCR and AI document interpretation are not implemented. Password-protected or unreadable PDFs remain attachable. Documents and links do not sync across devices. Keep original copies outside the app.

Run `node tests/ratecon-core.test.cjs` for field extraction and file signature checks.
