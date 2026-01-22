# WhatsApp Business Platform Integration

> **Environment:** Preview/Sandbox Testing Only  
> **Safety Level:** Maximum - Isolated & Removable

## Quick Start

This is a **sandbox integration** using Meta's test phone number (Path A). It is completely isolated from production.

### Files in this folder:

- `webhook.js` - Handles Meta verification + webhook events
- `health.js` - Health check endpoint  
- `send-test.js` - Send test template messages

### To test:

1. See full documentation: `/docs/whatsapp-sandbox.md`
2. Configure Vercel Preview environment variables
3. Push this branch to get a preview URL
4. Configure Meta webhook with preview URL
5. Access dev UI: `https://<preview-url>/__dev/whatsapp-sandbox`

### To remove:

Delete this entire folder and the corresponding UI folder in `/src/devtools/whatsapp`.

## Safety Guarantees

✅ No production impact  
✅ No business logic changes  
✅ Returns 200 quickly  
✅ Minimal logging (no tokens)  
✅ Kill switch: `WA_ENABLED=false`
