# RentLink — recent changes

## Summary

RentLink now recognizes the configured landlord by phone and provides a protected landlord dashboard for viewings, overdue balances, stats, and payment verification. Customer and tenant flows include clearer confirmations, waitlist names, balance breakdowns, and improved unit details. Authenticated admin cron routes support on-demand demo runs.

## Flows

- **Customers:** Browse units, book viewings, or join a waitlist with a name and phone number; confirmation buttons offer the next step.
- **Tenants:** Check a rent and water breakdown, submit payments, report maintenance, give notice, check payment status, or contact management.
- **Landlords:** The configured landlord phone opens the dashboard; commands show today's viewings, unpaid tenant balances, stats, and payment verification.

## Landlord commands

| Command | What it does | Requires landlord phone? |
|---|---|---|
| `viewings` / `landlord-viewings` | Lists today's viewings. | Yes |
| `overdue` / `landlord-overdue` | Lists unpaid tenants and total outstanding. | Yes |
| `stats` / `landlord-stats` | Shows occupancy, outstanding balances, today's viewings, and pending payments. | Yes |
| `help` / `landlord-help` | Lists available commands. | Yes |
| `verify <CODE>` | Verifies the newest matching payment and sends its receipt once. | Yes |
| `refresh` / `dashboard` / `landlord-menu` | Reopens the landlord dashboard. | Yes |
| `client` / `landlord-client` | Opens the customer main menu. | Yes |
| `hi`, `hello`, `menu`, `start`, `admin`, `landlord` | Opens the landlord dashboard. | Yes |

## Sheet write shapes

Values are appended in the following column order; empty strings preserve formula and unpopulated columns.

- **Viewings (A:E):** `[date, clientName, phone, unit, preferredTime]`
- **Waitlist (A:F):** `[date, phone, town, type, budget, name]`
- **Payments (A:H):** `[date, tenantName, phoneNumber, unit, '', mpesaMessage, '', 'Pending']`
- **Maintenance (A:H):** `[date, tenantName, unit, phone, '', description, '', 'Open']`
- **Notices (A:F):** `[date, tenantName, phoneNumber, unit, moveOutDate, 'Received']`
- **SentAlerts (A:C):** `[alertKey, sentAt, landlordId]`
- **Sessions (A:F):** `[phone, currentFlow, currentStep, JSON.stringify(context), updatedAt, landlordId]`

Properties and Tenants are read by the bot; their property and tenant records are maintained in the sheet.

## Demo cron triggers

Set `WEBHOOK_VERIFY_TOKEN` in the shell to the server's configured token, then run:

```sh
curl -X POST http://localhost:3000/admin/cron/reminders -H "Authorization: Bearer ${WEBHOOK_VERIFY_TOKEN}"
curl -X POST http://localhost:3000/admin/cron/report -H "Authorization: Bearer ${WEBHOOK_VERIFY_TOKEN}"
curl -X POST http://localhost:3000/admin/cron/receipts -H "Authorization: Bearer ${WEBHOOK_VERIFY_TOKEN}"
```

## Scaling to multiple landlords

- `resolveLandlord()` is the only place to change for a future Landlords sheet lookup.
- Sessions already carry `landlordId`.
- Alert payloads already accept `landlordId`.

## Known gaps (not fixed yet)

- 24h Meta window blocks landlord alerts outside the window.
- Properties.Status does not flip back to Available on notice.
- Maintenance rows stay 'Open' — no resolve path.
- Payments only flip to Verified via landlord `verify <code>`.
