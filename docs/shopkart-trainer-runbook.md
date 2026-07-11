# ShopKart Trainer Runbook

## Before Sharing the Branch

1. Run `npm run install:all`.
2. Run `npm test`.
3. Run `npm run test:ci` while Docker is available on the trainer machine.
4. Start the app against local MySQL and run `npm run smoke`.
5. Open `/api-docs` and confirm all eight assessment endpoints render.
6. Complete the UI flow from login to `/orders/{id}`.
7. Confirm `.env` is ignored and no populated credential file is tracked.
8. Confirm the Gitleaks step scans full history and passes with only the documented legacy baseline.

## Participant Distribution

Share:

- The `shopkart` branch
- `.env.example`
- `README.md`
- `docs/shopkart-scenario-contract.md`
- The assigned passwords through an approved secret channel

Do not share passwords in WhatsApp, slides, repository files, screenshots or recorded demonstrations.

## Clean Baseline

Before a live demonstration:

```bash
npm run db:reset
./scripts/shopkart-start.sh
```

PowerShell:

```powershell
npm run db:reset
.\scripts\shopkart-start.ps1
```

## Evidence Checks

- Health reports MySQL.
- Search for `bag` returns `SKU-BAG`.
- Two bags total `99800` paise.
- Alice can read her order.
- Bob receives `403` for Alice's order.
- `SKU-CAP` returns `409 OUT_OF_STOCK`.
- Cancelling a cancelled order returns `409 ORDER_NOT_PLACED`.
- One checkout creates one database row.

## Failure Recovery

| Symptom | Check |
| --- | --- |
| Database connection refused | MySQL service, `DB_HOST`, `DB_PORT` |
| Access denied | `DB_USER`, `DB_PASSWORD`, grants |
| Project configuration appears ignored | Process/IntelliJ values override `.env`; within either source, a complete `DB_*` set overrides `DATABASE_URL` |
| Unknown database | Run `npm run db:migrate`; verify create permission |
| Login always `401` | Run migration again after setting persona passwords |
| UI opens but API fails | ShopKart must be started through the backend on port 8080 |
| Old carts affect a demo | Run `npm run db:reset` |
