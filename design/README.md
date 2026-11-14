# Monomi designs

Approved design sources, exported from the "Monomi UI" design canvas. Each `.dc.html` file is one screen. They are references to match, not code to ship: copy the colours, type, spacing, copy and animation CSS (in each file's `<helmet><style>`), and rebuild them as real components in `apps/web`.

The files load a canvas runtime (`support.js`) that isn't included, so read the source rather than opening them in a browser.

| File | Route | Notes |
|---|---|---|
| `Main.dc.html` | `/` (desktop) | Tab switcher logic is in the script at the bottom |
| `Mobile.dc.html` | `/` (phone) | Same page at 390 px wide |
| `Jobs.dc.html` | `/jobs` | Map first, bottom sheet, price pins |
| `Job.dc.html` | `/jobs/[id]` | |
| `Capture.dc.html` | `/jobs/[id]/capture` | Camera state |
| `Checking.dc.html` | `/jobs/[id]/capture` | After sending: live checks |
| `Paid.dc.html` | `/jobs/[id]/capture` | Approved and paid |
| `Wallet.dc.html` | `/wallet` | Testnet cash-out quote |
| `Report.dc.html` | `/report/[id]` | Public. No photos unless the poster signs in |
| `Try.dc.html` | `/try` | Judge mode |
| `Agent.dc.html` | `/agent` | Console for agents and businesses |
| `ChecksNew.dc.html` | `/checks/new` | Post a check form |

Sample data in these files (names, amounts, distances, `tunde.testnet`) is placeholder content for the designs only. The real app reads everything from the contract and the API.
