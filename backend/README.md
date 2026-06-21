# Nexachain Backend

Express + MongoDB backend for the investment/referral platform.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in real values
npm run dev             # nodemon, or `npm start` for plain node
```

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs — use a long random string |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `DEFAULT_DAILY_ROI_PERCENT` | Fallback daily ROI % if not specified per-investment |
| `REFERRAL_LEVEL_PERCENTS` | Comma list of % per referral level, e.g. `10,5,3,2,1` |
| `MAX_REFERRAL_LEVELS` | Caps how far up the chain income/tree traversal goes |

## API Summary

All private routes require header: `Authorization: Bearer <token>`

### Auth
- `POST /api/auth/register` — `{ fullName, email, mobile, password, referredByCode? }`
- `POST /api/auth/login` — `{ email, password }`
- `GET /api/auth/me` (private)

### Investments
- `POST /api/investments` (private) — `{ amount, planName, planDurationDays, dailyRoiPercent? }`
- `GET /api/investments?page=1&limit=20` (private)

### Dashboard
- `GET /api/dashboard` (private) — wallet balance, total ROI, total level income, today's ROI, investment counts
- `GET /api/dashboard/roi-history?page=1&limit=20` (private)
- `GET /api/dashboard/referral-income?page=1&limit=20` (private)

### Referrals
- `GET /api/referrals/direct` (private) — level-1 referrals only
- `GET /api/referrals/tree` (private) — full nested referral tree (depth capped by `MAX_REFERRAL_LEVELS`)

## Business Logic Notes

### Daily ROI (services/roiService.js)
- Finds all `Active` investments not yet processed for today's UTC calendar date.
- Each investment is processed inside its own MongoDB transaction: ROI history insert, wallet credit, and referral-income distribution succeed or roll back together.
- **Idempotency**: `RoiHistory` has a unique index on `(investment, roiDate)`. Even if the cron fires twice, the second insert for the same investment/day throws a duplicate-key error, which is caught and skipped — no double crediting.

### Referral / Level Income (services/referralService.js)
- Walks up the `referredBy` chain from the investor, crediting each ancestor a percentage of the ROI event (configurable per level via `REFERRAL_LEVEL_PERCENTS`).
- **Idempotency**: `ReferralIncome` has a unique index on `(receiver, sourceRoiHistory, level)`, so re-running distribution for the same ROI event is a no-op on the second pass.

### Cron (jobs/roiCron.js)
- Runs daily at `0 0 * * *` (12:00 AM server time) via `node-cron`.
- Relies entirely on the database-level idempotency guards above — the job itself has no special "did I already run today" flag, since the unique indexes are a stronger guarantee than an in-memory or even DB flag checked outside a transaction.

## Assumptions
- Daily ROI % can be set per-investment (e.g. different plans); falls back to `DEFAULT_DAILY_ROI_PERCENT` if omitted.
- An investment auto-transitions to `Completed` once its `endDate` passes during ROI processing.
- Referral levels are capped (`MAX_REFERRAL_LEVELS`) both for income distribution and for the tree endpoint, to bound payload size and recursion depth.
- The referral tree endpoint uses recursive queries for clarity; for very large/deep networks, replace with a single `$graphLookup` aggregation for better performance.
- Passwords are hashed with bcrypt and never returned in API responses.
