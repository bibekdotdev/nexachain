# Nexachain Frontend

React dashboard for the investment/referral platform.

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # set REACT_APP_API_URL to your backend URL
npm start
```

Runs on http://localhost:3000 by default and expects the backend API at
`REACT_APP_API_URL` (defaults to `http://localhost:5000/api`).

## Structure

- `src/api/api.js` — Axios instance + endpoint wrappers, attaches JWT automatically, redirects to `/login` on 401.
- `src/context/AuthContext.js` — auth state, login/register/logout, persists token in `localStorage`.
- `src/pages/Login.jsx`, `Register.jsx` — auth forms.
- `src/pages/Dashboard.jsx` — loads summary, investments, ROI history, referral income, and referral tree in parallel; renders all sub-components.
- `src/components/DashboardCards.jsx` — wallet balance, today's ROI, totals.
- `src/components/InvestmentTable.jsx`, `RoiTable.jsx`, `ReferralTable.jsx` — history tables with loading/empty states.
- `src/components/ReferralTree.jsx` — collapsible nested referral tree.
- `src/components/EarningsChart.jsx` — Recharts line chart of ROI vs referral income over time.

## Assumptions
- Currency formatting assumes INR (`₹`); change `Intl.NumberFormat` locale/currency in `DashboardCards.jsx` and table components if needed.
- Pagination params are passed to history endpoints but the dashboard currently just requests a larger page size (50) rather than implementing full pagination controls — straightforward to extend.
- Referral tree depth is bounded server-side (`MAX_REFERRAL_LEVELS`); the tree component renders whatever depth the API returns.
