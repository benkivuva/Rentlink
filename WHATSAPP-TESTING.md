# Test RentLink in WhatsApp

This guide takes you from a local run to chatting with RentLink from your own WhatsApp account. The real WhatsApp path uses Meta's Cloud API test number. Mock mode is useful for checking server behavior, but it does **not** send WhatsApp messages.

## Before you start

You need:

- Node.js 18 or newer and npm.
- A Meta developer account and a Meta app with the WhatsApp product enabled.
- A WhatsApp recipient phone that you can verify in Meta's test-number setup.
- Access to the Google Sheet and its service account, if you want to test property and tenant lookups.
- ngrok for receiving Meta webhooks on your local machine.

Keep `.env` and `service-account.json` private. Do not paste access tokens or service-account JSON into chats, screenshots, or this guide.

## 1. Prepare the spreadsheet

1. In Google Cloud, enable the Google Sheets API for the service account's project.
2. Share the RentLink spreadsheet with the service account's `client_email` as an Editor. Read the email locally from `service-account.json`; don't share the file itself.
3. In `.env`, set `GOOGLE_SHEETS_ID` to the spreadsheet ID and `GOOGLE_SERVICE_ACCOUNT_JSON` to the path of the service-account JSON file.
4. Set `LANDLORD_ID=default` for the initial single-landlord setup.
5. Create the tabs and headers:

   ```powershell
   npm run setup:sheets
   ```

6. Add at least one available property row in `Properties`. Set `Status` to `Available`, fill in `Town`, `Type`, `Rent`, `Deposit`, `Apartment`, `Amenities`, `MapURL`, and `BudgetTier`, and set `LandlordID` to `default`.
7. To test tenant services, add a tenant row in `Tenants` with a phone number you control in `+254XXXXXXXXX` format and `LandlordID` set to `default`.

The setup script creates tabs and headers; it does not add sample homes or tenant accounts.

## 2. Configure Meta's WhatsApp test number

1. Open the Meta developer dashboard and select the app with WhatsApp enabled.
2. In **WhatsApp > API Setup**, select the provided test phone number and add your personal WhatsApp number as a recipient. Complete the verification step Meta shows.
3. Copy the test number's **Phone number ID**, the temporary or permanent **access token**, and the **WhatsApp Business Account ID** into your local `.env`:

   ```dotenv
   WHATSAPP_PROVIDER=meta
   META_PHONE_NUMBER_ID=your_phone_number_id
   META_ACCESS_TOKEN=your_access_token
   META_WABA_ID=your_whatsapp_business_account_id
   LANDLORD_PHONE=+2547XXXXXXXX
   LANDLORD_TILL_NUMBER=your_test_till_number
   WEBHOOK_VERIFY_TOKEN=make-a-long-random-value
   META_APP_SECRET=
   ```

   Use the landlord's real WhatsApp number only if you intend to receive real landlord alerts. You can use a test recipient number while validating. `META_APP_SECRET` is optional for local testing; configure it before relying on webhook signature checks in production.

4. Save `.env`. Restart the app whenever you change environment variables.

## 3. Start the bot and expose the webhook

Open two PowerShell windows in the project folder.

**Window 1 — start RentLink:**

```powershell
npm install
npm run dev
```

The server listens on port `3000` by default. In a browser, open `http://localhost:3000/health`; it should return `{"status":"ok"}`.

**Window 2 — start ngrok:**

```powershell
ngrok http 3000
```

Copy the HTTPS forwarding address ngrok displays, for example `https://example.ngrok-free.app`. Keep ngrok running while you test.

## 4. Register and verify the Meta webhook

1. In the Meta developer dashboard, open the app's **WhatsApp > Configuration** webhook settings.
2. Set the callback URL to `https://YOUR-NGROK-HOST/webhook`.
3. Enter the exact `WEBHOOK_VERIFY_TOKEN` value from `.env` as the verify token.
4. Complete Meta's **Verify and save** step.
5. Subscribe the WhatsApp webhook to the `messages` field.
6. If verification fails, check that the server and ngrok are running, the callback ends in `/webhook`, and the verify token exactly matches `.env`.

## 5. Send a first WhatsApp message

From the recipient phone you added in Meta, open a chat with Meta's WhatsApp test number. If Meta's API Setup page shows a required join phrase, send that phrase first. Then send:

```text
Hi
```

You should receive the RentLink menu. Select **Browse Properties**, then choose a town, unit type, and budget. Pick an apartment and unit to see its details. You can also send `quick` to start an apartment-name search, or `tenant` to start tenant verification.

Try **Book a Viewing** from a unit's detail screen. Enter a name, a Kenyan phone number such as `+254712345678`, and a preferred time. The request should be added to `Viewings`, and the configured landlord number should receive an alert.

## 6. Try the tenant menu

1. Send `tenant`.
2. Enter the last nine digits of a phone number that appears in the `Tenants` sheet.
3. Use the menu to check the balance, submit a payment message, report a maintenance issue, give notice, or contact the manager.
4. Confirm submissions appear in the matching `Payments`, `Maintenance`, or `Notices` sheet and that landlord alerts arrive at the configured landlord number.

Tenant verification only succeeds when the phone digits match a row in `Tenants`. For payment and issue testing, use your own test tenant row and clearly marked sample data.

## 7. Check bot output and saved data

- The terminal running `npm run dev` shows structured server logs and any provider errors.
- Meta API errors usually indicate a wrong token, phone number ID, recipient setup, or an expired temporary token.
- The spreadsheet tabs show saved viewings, waitlist entries, tenant requests, and payments.
- The `SentAlerts` tab records landlord alert deduplication keys.
- `GET http://localhost:3000/health` checks that the server is running; it does not test Meta connectivity.

## 8. Test without sending WhatsApp messages

To exercise local server behavior without contacting Meta, set `WHATSAPP_PROVIDER=mock` in `.env` and restart `npm run dev`. The mock provider prints outgoing message payloads to the terminal and sends nothing to WhatsApp. You can still send webhook requests only if you create them yourself; the mock provider does not provide an interactive chat simulator.

To return to the Meta test number, restore `WHATSAPP_PROVIDER=meta` and the Meta credentials, then restart the app.

## 9. Trigger the daily reminder job manually

The protected endpoint runs the daily reminder job. In PowerShell, replace the placeholder with the `WEBHOOK_VERIFY_TOKEN` value from `.env`:

```powershell
$headers = @{ Authorization = 'Bearer YOUR_WEBHOOK_VERIFY_TOKEN' }
Invoke-RestMethod -Method Post -Uri http://localhost:3000/run-reminders -Headers $headers
```

This can send real WhatsApp messages to tenants whose due dates match the reminder rules, and to the landlord when overdue accounts exist. Only use it after reviewing the test data in `Tenants`.

## Common issues

| Symptom | Check |
| --- | --- |
| No menu reply | Confirm the recipient is verified in Meta, the test-number chat is enabled, and `npm run dev` is running. |
| Meta webhook verification fails | Confirm ngrok is still running, the callback URL uses HTTPS and ends in `/webhook`, and the verify token matches. |
| Incoming messages don't reach RentLink | Subscribe the webhook to `messages`, then inspect the Meta webhook delivery log and local server terminal. |
| “Account not found” | Confirm the tenant row exists, `PhoneNumber` contains the correct digits, and `LandlordID` is `default`. |
| No properties appear | Confirm the row has `Status=Available`, exact town and budget values, matching unit type, and `LandlordID=default`. |
| Sheets API error | Confirm the Sheets API is enabled, the spreadsheet is shared with the service account, and the spreadsheet ID and credential path are correct. |
| Messages fail after working earlier | A temporary Meta access token may have expired; create or configure a valid token and restart the app. |

## Stop the local test

Press `Ctrl+C` in both PowerShell windows to stop the app and ngrok. Revoke temporary credentials if they were exposed, and remove any test rows you no longer need from the spreadsheet.
