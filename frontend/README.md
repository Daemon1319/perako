# Perako frontend

React JavaScript, Tailwind CSS, React Router, and Lucide icons. The app uses the existing Rails API; it does not connect to PostgreSQL directly.

## Local development

1. Start the Docker PostgreSQL container and Rails server on port 3000.
2. In this directory, run `npm install` if dependencies are missing, then `npm run dev`.
3. Open Vite's printed local URL. Requests to `/api/*` are forwarded to Rails by `vite.config.js`.

Use your existing account or create one on the sign-in screen. Login sessions are stored in `sessionStorage`, so refreshes keep the session in that tab; closing the tab ends local persistence. Tokens also expire server-side and logout revokes the current session.

## Screens

- **Home:** Current Philippine month only; income, expenses, net income, and fixed add buttons.
- **Transactions:** Defaults to the current month; month arrows/picker, all-time selection, type/category filters, and ten records per page. Totals follow the selected period, independently of list filters.
- **Transaction panels:** Separate fixed income/expense type based on the button tapped. Category and description are optional. Edit and delete are available by selecting a transaction.
- **Categories panel:** Open from the hamburger menu. Separate income and expense lists; create, rename, or delete. Deleting a category preserves its transactions.

## Source map

- `src/App.jsx`: Routing, shared data refresh, modal selection, and toast feedback.
- `src/context/`: Account initialization, sign-in, sign-out, and expired-session handling.
- `src/pages/`: Sign-in/signup, Home, and Transactions.
- `src/components/`: Shared layout, totals, bottom sheets, forms, and feedback.
- `src/hooks/useResource.js`: Abortable API loading and request error handling.
- `src/lib/api.js`: Fetch wrapper, API base URL, and bearer token handling.
- `src/lib/format.js`: PHP currency and Philippine calendar dates.
- `src/index.css`: Tailwind import, theme, and reusable component styles.

## Checks

`npm run build` creates the production bundle. `npm run lint` checks React/JavaScript rules. The existing Rails tests include monthly/all-time summary isolation and backend CRUD/authentication regressions.

## Vercel and Render

Set Vercel's project root to `frontend`, build command to `npm run build`, and output directory to `dist`. `vercel.json` handles browser refreshes on client routes.

Set `VITE_API_URL` in Vercel to the Render backend's origin, without `/api` or a trailing slash. For example: `https://your-backend.onrender.com`. Vite variables are public and embedded at build time: never put database credentials or private keys in them.

Set `FRONTEND_URL` on Render to the exact Vercel frontend origin. Rails already reads it for CORS. Restart/redeploy after changing environment variables. The Vite development proxy is only used locally.

## Verification notes

Browser-checked against the local Rails API: sign-in, refresh persistence, category creation/renaming, expense creation/editing, type filters, monthly/all-time selection, empty states, and mobile/desktop layout. Browser preview test records were removed afterward.

The production dependency audit is clear. The full npm audit still reports six moderate advisories in the existing development-only ESLint/minimatch dependency chain; npm does not offer a compatible automatic fix. No forced upgrades were applied.
