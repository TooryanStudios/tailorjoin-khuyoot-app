/**
 * WhatsApp Business Platform Webhook
 * 
 * Vercel Serverless Function for handling WhatsApp webhook events.
 * 
 * GET: Meta verification challenge
 * POST: Webhook events (messages, status updates, etc.)
 * 
 * SAFETY:
 * - Returns 200 quickly; does not call internal systems
 * - Logs minimal info; no access tokens logged
 * - Can be disabled via WA_ENABLED env var
 * - Isolated - can be deleted without affecting app
 */

export default async function handler(req, res) {
  const { method, query, body } = req;

  // Environment configuration
  const WA_ENABLED = process.env.WA_ENABLED === 'true';
  const WA_VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || '';
  const WA_MODE = process.env.WA_MODE || 'disabled';

  // ====================
  // GET: Verification Challenge
  // ====================
  if (method === 'GET') {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    console.log('[WhatsApp Webhook] Verification attempt:', {
      mode,
      tokenMatch: token === WA_VERIFY_TOKEN,
      hasChallenge: !!challenge
    });

    if (mode === 'subscribe' && token === WA_VERIFY_TOKEN) {
      console.log('[WhatsApp Webhook] Verification successful');
      return res.status(200).send(challenge);
    }

    console.warn('[WhatsApp Webhook] Verification failed');
    return res.status(403).json({ error: 'Verification failed' });
  }

  // ====================
  // POST: Webhook Events
  // ====================
  if (method === 'POST') {
    // Kill switch - return 200 but do nothing if disabled
    if (!WA_ENABLED) {
      console.log('[WhatsApp Webhook] Received event but WA_ENABLED=false, ignoring');
      return res.status(200).json({ received: true, processed: false });
    }

    try {
      // Parse webhook payload
      const data = typeof body === 'string' ? JSON.parse(body) : body;

      // Log minimal safe information
      const logEntry = {
        timestamp: new Date().toISOString(),
        mode: WA_MODE,
        object: data.object,
        entries: data.entry?.length || 0
      };

      // Extract first change for logging (if exists)
      if (data.entry?.[0]?.changes?.[0]) {
        const change = data.entry[0].changes[0];
        logEntry.field = change.field;
        logEntry.value = {
          messagingProduct: change.value?.messaging_product,
          metadataDisplayPhone: change.value?.metadata?.display_phone_number
        };

        // Log message details (if message event)
        if (change.value?.messages?.[0]) {
          const msg = change.value.messages[0];
          logEntry.message = {
            type: msg.type,
            from: msg.from, // wa_id
            timestamp: msg.timestamp,
            hasText: msg.type === 'text' ? msg.text?.body?.substring(0, 50) : undefined
          };
        }

        // Log status updates (if status event)
        if (change.value?.statuses?.[0]) {
          const status = change.value.statuses[0];
          logEntry.status = {
            messageId: status.id,
            status: status.status,
            timestamp: status.timestamp
          };
        }
      }

      console.log('[WhatsApp Webhook] Event received:', JSON.stringify(logEntry, null, 2));

      // Return 200 immediately (Meta expects quick response)
      return res.status(200).json({ received: true, processed: true });

    } catch (error) {
      console.error('[WhatsApp Webhook] Error processing event:', error.message);
      // Still return 200 to prevent Meta retries during dev
      return res.status(200).json({ received: true, error: error.message });
    }
  }

  // Other methods not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
