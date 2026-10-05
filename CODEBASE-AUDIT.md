# RentLink Codebase Audit

Audit scope: source files under `src/`, `scripts/`, `package.json`, and `.env.example` as present when this report was written. Line references use the current source line numbers.

## 1. Entry point and server

- **Entry point:** `src/index.ts:1-13`. It constructs the provider, Sheets service, alert service, session store, flow engine, and Express app (`src/index.ts:11`), binds with `app.listen(config.PORT, ...)` (`src/index.ts:12`), and starts cron jobs unless `NODE_ENV` is `test` (`src/index.ts:13`).
- **Port:** `PORT`, parsed as a positive integer with default `3000` at `src/config/index.ts:6`; passed to `app.listen` at `src/index.ts:12`.
- **WhatsApp webhook:** `GET /webhook` verifies the `hub.mode`, `hub.verify_token`, and returns `hub.challenge` (`src/app.ts:8`). `POST /webhook` validates the Meta signature when `META_APP_SECRET` is set, returns 200, then passes received messages to the flow engine (`src/app.ts:9,11`).
- **Other routes:** `GET /health` (`src/app.ts:7`); protected `POST /run-reminders` (`src/app.ts:10`). **Development simulator route:** NOT FOUND. The mock provider logs outgoing payloads, but it is not an HTTP simulator (`src/whatsapp/mock.provider.ts:2-6`).
- **`.env` loading:** Yes. `src/config/index.ts:1` imports `dotenv/config`; `src/config/index.ts:16` parses `process.env` with Zod.
- **Environment variables parsed by the config schema:** `NODE_ENV`, `PORT`, `LOG_LEVEL`, `WHATSAPP_PROVIDER`, `META_PHONE_NUMBER_ID`, `META_ACCESS_TOKEN`, `META_WABA_ID`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`, `FLARESEND_API_KEY`, `FLARESEND_BASE_URL`, `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `LANDLORD_ID`, `LANDLORD_PHONE`, `LANDLORD_TILL_NUMBER`, `SESSION_STORE`, `WEBHOOK_VERIFY_TOKEN`, and `META_APP_SECRET` (`src/config/index.ts:4-16`). `src/whatsapp/index.ts:8-10` requires provider-specific credentials when that provider is selected. `src/app.ts:8-10` reads the webhook verify token and optional Meta app secret through `config`.

## 2. WhatsApp provider

Files under `src/whatsapp/`:

- `src/whatsapp/provider.interface.ts`
- `src/whatsapp/http.ts`
- `src/whatsapp/index.ts`
- `src/whatsapp/mock.provider.ts`

`WhatsAppProvider` declares all four methods (`sendText`, `sendButtons`, `sendList`, `sendImage`) at `src/whatsapp/provider.interface.ts:3`. `HttpProvider` implements all four at `src/whatsapp/http.ts:3-9`; `MockProvider` implements all four at `src/whatsapp/mock.provider.ts:2-6`.

There are no separate `MetaProvider`, `TwilioProvider`, or `FlaresendProvider` classes/files. `src/whatsapp/index.ts:6-10` selects provider behavior using `WHATSAPP_PROVIDER` and configures the shared `HttpProvider` with provider-specific endpoint, headers, and payload formatting. `src/whatsapp/index.ts:12-22` contains Meta payload formatting. The factory supports `meta`, `twilio`, `flaresend`, and `mock` (`src/config/index.ts:7`, `src/whatsapp/index.ts:6-10`).

`MockProvider` writes one JSON object per outgoing message to `console.log`, with `provider`, `type`, recipient and message payload fields (`src/whatsapp/mock.provider.ts:3-6`). Its methods return `Promise<void>` and do not return fake message IDs.

## 3. Flow engine and flows

- The flow engine and runtime handlers are in `src/flow-engine.ts:12-44`; the webhook passes inbound text/button/list reply IDs to it in `src/app.ts:11`.
- Declarative flow data is in `src/config/flows.ts:1-5`. `rg` finds no import or use of `flowDefinitions` outside its declaration; runtime routing is implemented as conditions and branches in `src/flow-engine.ts:15-43`.
- Customer menu text and button data are in `src/messages/index.ts:1-4`; other menu messages and branch text are in `src/flow-engine.ts:16,28-43`.

**Flow/step names present in code:**

- Runtime session `flow` / `step` pairs written by `FlowEngine`: `browse` / `town`, `type`, `budget`, `apartment`, `unit`, `actions`; `quick` / `search`, `type`, `budget`, `apartment`, `unit`, `actions`; `tenantVerify` / `suffix`; `tenantMenu` / `menu`; `viewing` / `name`, `phone`, `time`; `payment` / `message`; `issue` / `description`; `notice` / `date`; `waitlist` / `consent`, `phone` (`src/flow-engine.ts:14,16,20,22-24,29-43`). Main menu is stateless in the session store (`src/flow-engine.ts:15-16,28`).
- Additional names in the config-only `flowDefinitions`: `tenantVerify.phoneSuffix`, and step `done` for `viewing`, `payment`, `issue`, `notice`, and `waitlist` (`src/config/flows.ts:2-4`). Those names are not the corresponding runtime session values.

Flow status below describes the code path present, not whether it has passed tests. “Partial” means the code omits a specified interaction/result or leaves a route incomplete.

| Flow | Status | Evidence / observed implementation |
| --- | --- | --- |
| Main menu (customer) | (a) fully implemented | Sends the welcome and three customer buttons (`src/flow-engine.ts:28`, `src/messages/index.ts:2`); button IDs are dispatched at `src/flow-engine.ts:16`. |
| Browse properties | (b) partially implemented | Town/type/budget/apartment/unit selection, available-unit filtering, details, optional image and action buttons are present (`src/flow-engine.ts:29-39`). “Main Menu” from the unit action calls `main` without clearing the active browse session (`src/flow-engine.ts:36`). |
| Quick search | (b) partially implemented | Apartment substring search and result path share `browse` (`src/flow-engine.ts:29-37,39`; `src/services/sheets.service.ts:14`). It follows the same incomplete action/menu handling noted above. |
| Book viewing | (a) fully implemented | Collects name, validates phone, collects time, writes `Viewings`, sends alert, and confirms (`src/flow-engine.ts:22`; `src/services/sheets.service.ts:20`). |
| Waitlist | (a) fully implemented | Handles yes/no consent, validates phone, writes `Waitlist`, alerts landlord, and confirms (`src/flow-engine.ts:43`; `src/services/sheets.service.ts:21`). |
| Talk to agent | (a) fully implemented | Sends a `wa.me` link with prefilled text (`src/flow-engine.ts:16`). |
| Tenant verification | (b) partially implemented | Looks up the submitted text by matching its digits as a phone suffix and has not-found/retry responses (`src/flow-engine.ts:16,20`; `src/services/sheets.service.ts:15`). The input is not checked to be exactly nine digits. |
| Tenant main menu | (b) partially implemented | Sends two button messages with three entries each (`src/flow-engine.ts:40`, `src/messages/index.ts:3`). It does not include a back-to-menu button after tenant actions. |
| Check balance | (b) partially implemented | Re-fetches tenant and displays balance, water, total, due date, lease and till (`src/flow-engine.ts:41`). It sends no Back to Menu button. |
| Submit payment | (b) partially implemented | Saves as Pending, sends landlord alert, and confirms (`src/flow-engine.ts:41-42`; `src/services/sheets.service.ts:17`). It does not send the specified Back to Menu button. |
| Report issue | (b) partially implemented | Saves an Open maintenance row, alerts landlord, and confirms (`src/flow-engine.ts:41-42`; `src/services/sheets.service.ts:18`). It does not send the specified Back to Menu button. |
| Give notice | (b) partially implemented | Saves a Received notice row, alerts landlord, and confirms (`src/flow-engine.ts:41-42`; `src/services/sheets.service.ts:19`). It does not send the specified Back to Menu button. |
| Talk to manager | (a) fully implemented | Sends a `wa.me` link with assigned-unit context (`src/flow-engine.ts:41`). |
| Check payment status | (b) partially implemented | Reads payment rows and reports only the latest status or no records (`src/flow-engine.ts:41`; `src/services/sheets.service.ts:26`). It does not include receipt details for verified payments or a Back to Menu button. |

**Tenant main menu exact message text and button IDs/titles:**

`src/flow-engine.ts:40` sends these two messages in order:

1. Message: `Tenant services — choose an option:`
   - `balance` — `Check Balance`
   - `payment` — `Submit Payment`
   - `issue` — `Report Issue`
2. Message: `More tenant services:`
   - `notice` — `Give Notice`
   - `manager` — `Talk to Manager`
   - `status` — `Payment Status`

The button values come from `src/messages/index.ts:3` and are split with `slice(0,3)` and `slice(3)` at `src/flow-engine.ts:40`.

## 4. Sessions

- Session abstraction and implementations are in `src/services/session.service.ts:4-7`; the engine reads/writes/clears through the injected `SessionStore` (`src/flow-engine.ts:13-15,20,22-24`).
- Interface: `SessionStore` defines `get(phone)`, `set(session)`, and `clear(phone)` at `src/services/session.service.ts:4`.
- Memory implementation: `MemorySessionStore` uses a `Map` at `src/services/session.service.ts:5`.
- Sheets implementation: `SheetsSessionStore` appends session snapshots through `SheetsService` and reads the latest row at `src/services/session.service.ts:6`; selector `SESSION_STORE=sheets|memory` is at `src/services/session.service.ts:7`.
- Session row access is implemented by `addSession` and `getLatestSession` in `src/services/sheets.service.ts:22-23`.

## 5. SheetsService

`SheetsService` is defined in `src/services/sheets.service.ts:8-29`. Its public methods and sheet access are:

| Method/signature | Sheet access |
| --- | --- |
| `constructor(spreadsheetId=config.GOOGLE_SHEETS_ID, api?)` (`src/services/sheets.service.ts:10`) | Configures spreadsheet and optional API client; no sheet read/write by itself. |
| `getAvailableUnits(filter: PropertyFilter, landlordId=config.LANDLORD_ID): Promise<Property[]>` (`src/services/sheets.service.ts:14`) | Reads `Properties`. |
| `getTenantByPhone(phone: string, landlordId=config.LANDLORD_ID): Promise<Tenant\|undefined>` (`src/services/sheets.service.ts:15`) | Reads `Tenants`. |
| `getTenants(landlordId=config.LANDLORD_ID)` (`src/services/sheets.service.ts:16`) | Reads `Tenants`. |
| `addPayment(t: Tenant, message: string)` (`src/services/sheets.service.ts:17`) | Appends `Payments`. |
| `addMaintenance(t: Tenant, description: string)` (`src/services/sheets.service.ts:18`) | Appends `Maintenance`. |
| `addNotice(t: Tenant, moveOutDate: string)` (`src/services/sheets.service.ts:19`) | Appends `Notices`. |
| `addViewing(input: {name:string; phone:string; unit:string; time:string}, landlordId=config.LANDLORD_ID)` (`src/services/sheets.service.ts:20`) | Appends `Viewings`. |
| `addWaitlist(input: {phone:string; town:string; type:string; budget:string}, landlordId=config.LANDLORD_ID)` (`src/services/sheets.service.ts:21`) | Appends `Waitlist`. |
| `addSession(phone: string, flow: string, step: string, context: Record<string,unknown>, landlordId=config.LANDLORD_ID)` (`src/services/sheets.service.ts:22`) | Appends `Sessions`. |
| `getLatestSession(phone: string, landlordId=config.LANDLORD_ID)` (`src/services/sheets.service.ts:23`) | Reads `Sessions`. |
| `hasAlert(key: string, landlordId=config.LANDLORD_ID)` (`src/services/sheets.service.ts:24`) | Reads `SentAlerts`. |
| `markAlert(key: string, landlordId=config.LANDLORD_ID)` (`src/services/sheets.service.ts:25`) | Appends `SentAlerts`. |
| `getPaymentRows(landlordId=config.LANDLORD_ID)` (`src/services/sheets.service.ts:26`) | Reads `Payments`. |
| `markReceiptSent(rowIndex: number)` (`src/services/sheets.service.ts:27`) | Updates column G in `Payments`. |
| `setupSheets()` (`src/services/sheets.service.ts:28`) | Reads spreadsheet metadata, creates missing tabs, and writes headers to all configured sheets. |

The service is parameterized by landlord ID for property, tenant, session, alert, and payment reads, and viewing/waitlist/session/alert writes; payment, maintenance, and notice writes use `t.landlordId` (`src/services/sheets.service.ts:14-26`). The service is **not universally landlord-parameterized**: `markReceiptSent(rowIndex)` has no landlord argument, and `setupSheets()` has no landlord argument (`src/services/sheets.service.ts:27-28`). Rows without a `LandlordID` value are mapped to the literal `default` (`src/services/sheets.service.ts:14-16,23-26`).

## 6. Alerts and scheduler

- `AlertService` accepts exactly five alert types: `viewing`, `payment`, `maintenance`, `notice`, and `waitlist` (`src/services/alerts.service.ts:5`). Their labels and dispatch behavior are at `src/services/alerts.service.ts:8`.
- Cron schedules are in `src/services/scheduler.ts:8-11`:

| Expression | Calls | Behavior in called function |
| --- | --- | --- |
| `0 9 * * *` | `runDailyReminders(sheets, wa, alerts)` (`src/services/scheduler.ts:9`) | Sends three-day, due-day, and overdue tenant messages; overdue accounts are summarized to landlord (`src/services/scheduler.ts:14`). |
| `0 9 5 * *` | `runMonthlyReport(sheets, wa)` (`src/services/scheduler.ts:10`) | Sends paid-unit percentage and outstanding total to landlord (`src/services/scheduler.ts:15`). |
| `*/15 * * * *` | `runReceipts(sheets, wa)` (`src/services/scheduler.ts:11`) | Sends receipts for Verified, not-yet-receipted payments, then marks them sent (`src/services/scheduler.ts:16`). |

No separate cron expressions exist for the three-day reminder, due-day reminder, and overdue alert; all are branches in the single daily job (`src/services/scheduler.ts:9,14`).

## 7. Tests

Test files present:

- `src/flow-engine.test.ts:11-16` — customer menu display, quick-search entry, tenant-verification entry, and tenant-not-found recovery. It does not exercise the complete browse, viewing, waitlist, or tenant submission paths.
- `src/utils/phone.test.ts:3` — Kenyan phone normalization and invalid phone rejection; no conversation flow.

`npm test` was run. It exited with code 1 before running test cases. Output verbatim:

```text

> rentlink-whatsapp-bot@1.0.0 test
> vitest run

node:internal/errors:496
    ErrorCaptureStackTrace(err);
    ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\Users\User\Desktop\Rentlink\node_modules\@vitest\pretty-format\dist\index.js' imported from C:\Users\User\Desktop\Rentlink\node_modules\@vitest\utils\dist\index.js
    at new NodeError (node:internal/errors:405:5)
    at finalizeResolution (node:internal/modules/esm/resolve:327:11)
    at moduleResolve (node:internal/modules/esm/resolve:980:10)
    at defaultResolve (node:internal/modules/esm/resolve:1206:11)
    at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:404:12)
    at ModuleLoader.resolve (node:internal/modules/esm/loader:373:25)
    at ModuleLoader.getModuleJob (node:internal/modules/esm/loader:250:38)
    at ModuleWrap.<anonymous> (node:internal/modules/esm/module_job:76:39) {
  url: 'file:///C:/Users/User/Desktop/Rentlink/node_modules/@vitest/pretty-format/dist/index.js',
  code: 'ERR_MODULE_NOT_FOUND'
}

Node.js v18.20.4
```

## 8. Known gaps

- Literal `TODO` markers: NOT FOUND in `src/` or `scripts/`.
- A function that throws an error explicitly saying “not implemented”: NOT FOUND. Actual explicit throws are the missing Google Sheets ID guard (`src/services/sheets.service.ts:11`) and missing provider credential guard (`src/whatsapp/index.ts:5`).
- Empty production function bodies: NOT FOUND. Empty async callbacks appear as test mocks in `src/flow-engine.test.ts:6-8` (`sendList`, `sendImage`, `addSession`, `send`).
- Runtime flow-definition mismatch: `src/config/flows.ts:4` declares `tenantVerify.phoneSuffix`, but runtime uses `tenantVerify.suffix` (`src/flow-engine.ts:16,20`). The config-only `done` steps and flow definitions are not used by `FlowEngine`.
- Environment variable referenced in the config schema or runtime code but missing from `.env.example`: NOT FOUND. All 20 config-schema variables at `src/config/index.ts:5-14` are present at `.env.example:1-20`. `process.env` is otherwise read only by that schema (`src/config/index.ts:16`).
