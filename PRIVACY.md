# Privacy Policy — History Revamped

_Last updated: April 22, 2026_

History Revamped is a Chrome extension that replaces the default `chrome://history` page with a richer dashboard. This policy explains what the extension does — and, more importantly, what it does **not** do — with your data.

## Summary

**Your browsing history never leaves your browser.** History Revamped reads your local history through Chrome's built-in `chrome.history` API and displays it on a page that runs entirely on your device. Nothing is uploaded, transmitted, sold, shared, or synced anywhere.

## What data the extension accesses

To do its job, History Revamped reads the following data from your browser:

- **Browsing history** — URLs, page titles, visit timestamps, visit counts, and Chrome's internal `transition` type for each visit (e.g. typed, link, reload). This is the same data that the default Chrome history page shows.
- **Favicons** — fetched through Chrome's local favicon cache to display alongside history entries.

The extension does **not** access:

- Page content, cookies, form data, passwords, or any data inside the pages you've visited
- Bookmarks, downloads, open tabs, your Google account, or any synced data
- Information about other extensions
- The clipboard, microphone, camera, location, or any other device hardware

## What data the extension collects, transmits, or shares

**None.**

Specifically, History Revamped:

- Does **not** collect, transmit, or upload your browsing history to any server
- Does **not** include analytics, telemetry, crash reporting, or any third-party tracking
- Does **not** make network requests of any kind to remote servers
- Does **not** sell your data to third parties
- Does **not** use or transfer your data for purposes unrelated to the extension's single purpose (displaying your history)
- Does **not** use or transfer your data to determine creditworthiness or for lending purposes
- Does **not** require an account, sign-in, or any personal information to use

All processing happens locally inside your browser.

## Where your data lives

Your browsing history continues to live where it always has: in Chrome's local profile on your device. History Revamped only reads from this store; it does not create its own copy or store data anywhere else. The extension itself does not write to any type of persistent store.

If you uninstall the extension, no extension-specific data needs to be cleaned up because none was ever created.

## Permissions and why they are requested

The extension requests only the minimum permissions needed to function:

- **`history`** — required to read your browsing history so it can be displayed in the dashboard.
- **`favicon`** — required to show site icons next to history entries, served from Chrome's local favicon cache.
- **`chrome_url_overrides` (history)** — replaces the default `chrome://history` page with the extension's dashboard.

## Children's privacy

History Revamped does not collect any personal information from anyone, including children under 13.

## Changes to this policy

If this policy is ever updated, the new version will be posted at the same URL and the "Last updated" date at the top will be revised. Because the extension does not collect or transmit data, material changes are unlikely.

## Contact

Questions or concerns about this policy can be filed as an issue on the project's public repository:

<!-- TODO: replace with your actual repo URL -->
https://github.com/jyepe/chrome-history-extension/issues
