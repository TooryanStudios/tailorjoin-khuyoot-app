# WhatsApp Business Platform - Sandbox Testing Guide

> **Status:** Preview/Testing only (Meta Test Number - Path A)  
> **Environment:** Vercel Preview Deployments  
> **Safety Level:** Maximum - isolated, removable, no production impact

---

## Overview

This integration implements WhatsApp Business Platform for testing purposes using Meta's test phone number (Path A). It is designed to be:

- ✅ **Isolated** - All code in `/api/whatsapp` and `/src/devtools/whatsapp`
- ✅ **Removable** - Delete folders + env vars = clean removal
- ✅ **Safe** - Returns 200 quickly, no internal system calls
- ✅ **Preview-only** - Uses Vercel Preview Deployments (not production)

---

## Architecture

### Files Created

```
/api/whatsapp/
├── webhook.js        # Handles Meta verification + webhook events
├── health.js         # Health check endpoint
└── send-test.js      # Send test template messages (sandbox only)

/src/devtools/whatsapp/
└── WhatsAppSandboxPanel.tsx  # Dev-only UI for testing

/docs/
└── whatsapp-sandbox.md       # This file
```

### Environment Variables

All variables are added in **Vercel Preview environment ONLY**:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `WA_ENABLED` | Yes | Kill switch | `"true"` |
| `WA_VERIFY_TOKEN` | Yes | Meta verification token | `"khuyoot_verify_2026_xyz123"` |
| `WA_MODE` | Yes | Operational mode | `"sandbox"` |
| `WA_GRAPH_VERSION` | Yes | Graph API version | `"v22.0"` |
| `WA_TEMP_ACCESS_TOKEN` | For sending | Temporary access token (expires ~60min) | Generated in Meta API Testing |
| `WA_TEST_PHONE_NUMBER_ID` | For sending | Meta test phone number ID | `"947240775137969"` |
| `WA_TEST_TEMPLATE_NAME` | For sending | Template name | `"jaspers_market_order_confirmation_v1"` |
| `WA_TEST_TEMPLATE_LANG` | For sending | Template language | `"en_US"` |
| `WA_DEFAULT_TO` | Optional | Default recipient phone | `"96892988080"` |

---

## Setup Instructions

### Step 1: Create Feature Branch

```bash
git checkout -b feature/whatsapp-preview
# Files are already created in this branch
```

### Step 2: Configure Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables listed above
3. **Important:** Select "Preview" environment ONLY (not Production)
4. Leave `WA_TEMP_ACCESS_TOKEN` empty for now

### Step 3: Push Branch & Get Preview URL

```bash
git add .
git commit -m "Add WhatsApp sandbox integration (preview only)"
git push origin feature/whatsapp-preview
```

Wait for Vercel to build. You'll get a preview URL like:
```
https://khuyoot-<hash>-<team>.vercel.app
```

### Step 4: Configure Meta Webhook

1. Go to Meta App Dashboard → WhatsApp → Configuration
2. Set Callback URL: `https://<your-preview-url>/api/whatsapp/webhook`
3. Set Verify Token: Same value as `WA_VERIFY_TOKEN` you added to Vercel
4. Subscribe to webhook fields:
   - `messages` (required)
   - `message_status` (optional)
5. Click "Verify and Save"

Meta will call `GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`

If successful, you'll see "Verified" status in Meta dashboard.

### Step 5: Test Receiving Messages

1. Go to Meta API Testing page
2. Turn on webhook listening
3. Send a test message from the test number to your phone
4. Reply from your phone
5. Check Vercel Function Logs:
   - Go to Vercel → Deployments → Your Preview → Functions
   - Find `/api/whatsapp/webhook`
   - You should see logs with received message details

### Step 6: Test Sending Messages

1. In Meta API Testing, generate a temporary access token (expires in ~60 minutes)
2. Copy the token
3. In Vercel Dashboard → Environment Variables:
   - Find `WA_TEMP_ACCESS_TOKEN`
   - Paste the token
   - Click Save
4. **Important:** Redeploy to pick up the new token:
   - Option A: Push a small commit to the branch
   - Option B: In Vercel, go to Deployments → Find your preview → Redeploy
5. Open the dev testing UI:
   ```
   https://<your-preview-url>/__dev/whatsapp-sandbox
   ```
6. Fill in the form (or leave empty to use defaults)
7. Click "Send Sandbox Test Message"
8. Check your phone - you should receive the message

---

## Testing Checklist

- [ ] Health endpoint responds: `GET /api/whatsapp/health` → `{ ok: true, mode: "sandbox", enabled: true }`
- [ ] Meta webhook verification succeeds
- [ ] Receiving messages works (Meta → Your Phone → Reply → Webhook logs it)
- [ ] Sending messages works (UI → Meta API → Phone receives message)
- [ ] Logs show minimal PII (no access tokens logged)
- [ ] Production environment is untouched

---

## Local Development

### Setup Local Environment

Create `.env.local` (already in `.gitignore`):

```env
WA_ENABLED=true
WA_VERIFY_TOKEN=khuyoot_verify_2026_xyz123
WA_MODE=sandbox
WA_GRAPH_VERSION=v22.0
WA_TEMP_ACCESS_TOKEN=
WA_TEST_PHONE_NUMBER_ID=947240775137969
WA_TEST_TEMPLATE_NAME=jaspers_market_order_confirmation_v1
WA_TEST_TEMPLATE_LANG=en_US
WA_DEFAULT_TO=96892988080
```

### Run Locally

```bash
npm run dev
```

Access dev panel:
```
http://localhost:3000/__dev/whatsapp-sandbox
```

**Note:** For webhooks to work locally, you need to:
- Use a tunneling service like `ngrok` to expose localhost
- Update Meta webhook URL to the ngrok URL
- Or just test webhooks on the Vercel preview deployment

---

## API Endpoints

### GET /api/whatsapp/health

Health check - verify integration is reachable.

**Response:**
```json
{
  "ok": true,
  "mode": "sandbox",
  "enabled": true,
  "graphVersion": "v22.0",
  "timestamp": "2026-01-22T12:00:00.000Z"
}
```

### GET /api/whatsapp/webhook

Meta verification endpoint.

**Query Parameters:**
- `hub.mode=subscribe`
- `hub.verify_token=<your-token>`
- `hub.challenge=<challenge-string>`

**Response:** Returns the challenge string (200) or 403 if verification fails.

### POST /api/whatsapp/webhook

Webhook events receiver.

**Request Body:** Meta webhook payload (see [Meta documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components))

**Response:**
```json
{
  "received": true,
  "processed": true
}
```

Logs minimal safe information to Vercel Function Logs.

### POST /api/whatsapp/send-test

Send a test template message (sandbox only).

**Request Body:**
```json
{
  "to": "96892988080",  // optional, defaults to WA_DEFAULT_TO
  "name": "John Doe",    // optional template param
  "order": "#ORD123",    // optional template param
  "date": "2026-01-22"   // optional template param
}
```

**Response (success):**
```json
{
  "success": true,
  "messageId": "wamid.xxx",
  "to": "96892988080",
  "response": { /* Graph API response */ }
}
```

**Response (error):**
```json
{
  "error": "Temporary access token not configured",
  "hint": "Generate a temp token in Meta API Testing and add it to WA_TEMP_ACCESS_TOKEN env var"
}
```

---

## Safety Features

### Kill Switch
Set `WA_ENABLED=false` to disable all WhatsApp functionality. Webhook will return 200 but do nothing.

### No Production Impact
- All code is isolated in new folders
- No modifications to existing business logic
- No changes to routing, auth, payments, or core UI
- Uses separate Vercel Preview environment

### Minimal Logging
- No access tokens logged
- Only logs safe, minimal information:
  - Message type
  - wa_id (phone number)
  - First 50 chars of text
  - Timestamps

### Fast Response
- Webhook returns 200 immediately
- Does not call internal systems
- Prevents Meta retry storms

---

## Removing the Integration

To completely remove WhatsApp integration:

1. Delete folders:
   ```bash
   rm -rf api/whatsapp
   rm -rf src/devtools/whatsapp
   rm docs/whatsapp-sandbox.md
   ```

2. Remove dev route from `App.tsx`:
   - Delete the import: `const WhatsAppSandboxPanel = ...`
   - Delete the route: `<Route path="/__dev/whatsapp-sandbox" ... />`

3. Remove Vercel environment variables:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Delete all `WA_*` variables

4. Commit and push:
   ```bash
   git add .
   git commit -m "Remove WhatsApp sandbox integration"
   git push
   ```

**Done.** No other files need changes.

---

## Next Steps (Future - Path B)

Once you're ready to move from sandbox (Meta test number) to production (real business number):

1. Complete Meta Business Verification
2. Get approval for WhatsApp Business API
3. Register your business phone number
4. Create production templates (submit for approval)
5. Update env vars:
   - `WA_MODE=production`
   - `WA_PHONE_NUMBER_ID=<real-id>`
   - `WA_ACCESS_TOKEN=<permanent-token>` (stored in Vercel secrets)
6. Implement actual business logic (order notifications, customer support, etc.)
7. Deploy to production environment

---

## Troubleshooting

### Webhook verification fails
- Check that `WA_VERIFY_TOKEN` in Vercel matches what you entered in Meta dashboard
- Ensure preview deployment is live and reachable
- Check Vercel Function Logs for the webhook endpoint

### Messages not received
- Verify webhook is subscribed to `messages` field in Meta dashboard
- Check Vercel Function Logs - you should see the event logged
- Ensure `WA_ENABLED=true`

### Cannot send test message
- Generate a fresh temporary token (they expire in ~60 minutes)
- Update `WA_TEMP_ACCESS_TOKEN` in Vercel environment variables
- Redeploy the preview to pick up the new token
- Check that `WA_TEST_PHONE_NUMBER_ID` is correct

### "Temporary access token not configured"
- You need to generate a token in Meta API Testing page
- Add it to Vercel env var `WA_TEMP_ACCESS_TOKEN`
- Redeploy or wait for automatic deployment

---

## Resources

- [Meta WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Webhook Setup Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components)
- [Sending Messages Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)

---

**Last Updated:** January 22, 2026  
**Author:** GitHub Copilot / AI Assistant
