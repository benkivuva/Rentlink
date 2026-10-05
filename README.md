# RentLink WhatsApp Bot

TypeScript and Express WhatsApp assistant for rental enquiries and tenant services. It supports Google Sheets, an in-memory demo mode, Meta Cloud API, Twilio, Flaresend, and a local mock transport.

## Setup

Requires Node.js 20+. Copy `.env.example` to `.env`, choose `WHATSAPP_PROVIDER=mock` for local development, and set `GOOGLE_SHEETS_ID` plus a Google service account JSON file to use the spreadsheet. Share the spreadsheet with the service account email. The existing `.env` and service-account file are ignored by Git; never commit credentials.

Install dependencies with `npm install`, then start with `npm run dev`. `GET /health` checks the process. Configure the Meta webhook callback as `/webhook` and use `WEBHOOK_VERIFY_TOKEN` for verification. Set `META_APP_SECRET` to validate webhook signatures.

## Sheets

Run `npm run setup:sheets` to create missing tabs and write the expected headers. The setup only creates tabs and headers; it does not seed property or tenant records. Add a `LandlordID` column (included in setup) to each sheet and use `LANDLORD_ID` to scope records. Legacy rows without that value are assigned `default`.

## Provider configuration

Set `WHATSAPP_PROVIDER` to `mock`, `meta`, `twilio`, or `flaresend`, then supply that provider's credentials. Meta's interactive message limit is enforced at three buttons. Mock mode logs outgoing messages without contacting an external service. Flaresend's API shape is treated as a JSON `POST /messages` adapter; adjust its base URL/payload in `src/whatsapp/index.ts` if your account uses a different API contract.

## Sessions and scheduled jobs

The memory session store is suitable for one-process demos and resets on restart. The `sheets` setting appends session snapshots to the Sessions sheet and reads the latest snapshot per phone. Keep a dedicated always-on worker for `node-cron`; Render free web instances sleep, so use a paid worker or point an external scheduler at `POST /run-reminders` with `Authorization: Bearer <WEBHOOK_VERIFY_TOKEN>` to run daily reminders. The endpoint is intentionally limited to the daily reminder job.

## Tenant access and production

Users can reply `tenant` to enter tenant services, then provide the last nine phone digits. Keep the source tenant number data normalized and restrict access to the spreadsheet. The example webhook is designed for Meta Cloud API. Twilio and Flaresend send adapters are included; inbound webhook parsing is not provider-specific yet. Before live use, verify each provider's interactive payload format, configure webhook retries and monitoring, and provide approved WhatsApp message templates for business-initiated reminders.

## Commands

- `npm run dev` — watch-mode development
- `npm run build` — compile to `dist`
- `npm start` — run compiled service
- `npm run setup:sheets` — create required tabs and headers
- `npm test` — run Vitest suite

## Deploy

Deploy as a Node web service with `npm run build` and `npm start`, configure environment variables in the host dashboard, and expose port `PORT`. For Meta, set the public webhook URL and verify token in the Meta app dashboard. Use a persistent worker for cron schedules. `ngrok http 3000` can expose local development webhooks.
