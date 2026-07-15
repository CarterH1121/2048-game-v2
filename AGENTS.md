# 2048-game-v2 Working Agreements

## Scope and source of truth

- This repository is the player-facing H5 frontend only. Do not modify `2048-admin`, backend code, databases, Nginx, systemd, or production hosts from this workspace.
- `index.html` is the real player SPA and runtime source of truth. It intentionally contains the application HTML, CSS, and JavaScript in one file; improve it incrementally rather than replacing the architecture during closeout work.
- `sw.js` is the production Service Worker. Any app-shell change that can affect cached clients must include a deliberate cache-version or update-strategy review.
- `src/styles.css` and the root verification scripts are historical/supporting materials. Do not assume they are wired into the live page without checking `index.html`.

## Historical HTML files

- The four tracked `index*backup*`/`index*.bak*` files were imported together in the initial Git commit. Their filenames, sizes, and content diffs suggest a chronological progression, but Git does not prove that lineage.
- Do not delete, rename, or bulk-edit historical HTML files without a separate provenance review and explicit approval.
- Never copy a historical file over `index.html` merely because a document calls it a newer version; verify features and Git history first.

## Local development and verification

- Install dependencies with `npm ci`.
- Run the full local gate with `npm test`.
- Browser acceptance is implemented in `tests/acceptance.js`. It starts an isolated local server, mocks API responses, blocks non-local browser requests, and writes screenshots under ignored `output/playwright/acceptance/`.
- For meaningful UI changes, verify 360x800, 375x812, 390x844, 430x932, plus a short mobile landscape viewport.
- Preserve unrelated work and keep UTF-8 explicit in Windows PowerShell reads.

## API and production safety

- Localhost uses same-origin `/api`; deployed hosts default to port `3001` on the current hostname. A host page may set `window.GAME2048_API_BASE_URL` before the main script to override this.
- Never place passwords, tokens, cookies, private keys, or server credentials in this repository. `deploy.sh` accepts an authorized SSH target via environment variables and assumes key-based SSH.
- Do not run `deploy.sh`, SSH, production HTTP write tests, database operations, or release actions unless the current task explicitly authorizes them.
- Browser tests must mock or intercept the API. A local acceptance run must not create users, submit scores, sign in, or write logs on production.

## Change discipline

- Preserve game rules and backend field names unless a task explicitly changes the contract.
- Escape all server-controlled text before inserting it through `innerHTML`.
- Keep touch targets at least 44px where practical, protect safe areas, and visually inspect both portrait and landscape after layout changes.
- Report legacy test false positives or stale assertions as such; do not claim browser acceptance from source-string checks alone.
