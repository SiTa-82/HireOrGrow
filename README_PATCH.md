# HireOrGrow Blue Lagoon — UI Hotfix v3.3

**Applies to:** HireOrGrow Blue Lagoon Unified Setup v3.2.

## Fix

- Shortens the form labels to **Salary period** and **Reporting currency**.
- Moves **Optional** into the help text below Reporting currency.
- Aligns both labels and selects at all desktop and tablet widths, using matching control widths and heights.
- At very narrow mobile widths, the two controls stack to avoid horizontal overflow.

## Apply

1. Back up `index.html` and `styles.css` from your current HireOrGrow v3.2 project.
2. Copy the two files from this archive into the **root folder of the app** (the folder that already contains `index.html`, `styles.css`, and `app.js`). Allow your computer to replace the existing files.
3. Reopen the app and refresh the browser (Ctrl+Shift+R on Windows or Cmd+Shift+R on Mac if an old version is cached).

No other files should be replaced.

## Rollback

Restore the original `index.html` and `styles.css` from the v3.2 archive or your backup.

## Scope

This is a UI-only fix. No changes were made to JavaScript, formulas, salary data, or provider integrations. Existing IDs, options, and form behavior are unchanged.
