/**
 * WhatsApp Send Test Template Message
 * 
 * SANDBOX ONLY - Uses Meta test phone number (Path A).
 * Sends a template message using temporary access token.
 * 
 * SAFETY:
 * - Only works in sandbox mode (WA_MODE=sandbox)
 * - Requires temporary token in WA_TEMP_ACCESS_TOKEN
 * - Never logs access token
 * - Returns 403 if not in sandbox mode
 */

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Environment configuration
  const WA_ENABLED = process.env.WA_ENABLED === 'true';
  const WA_MODE = process.env.WA_MODE || 'disabled';
  const WA_TEMP_ACCESS_TOKEN = process.env.WA_TEMP_ACCESS_TOKEN || '';
  const WA_TEST_PHONE_NUMBER_ID = process.env.WA_TEST_PHONE_NUMBER_ID || '';
  const WA_GRAPH_VERSION = process.env.WA_GRAPH_VERSION || 'v22.0';
  const WA_TEST_TEMPLATE_NAME = process.env.WA_TEST_TEMPLATE_NAME || 'hello_world';
  const WA_TEST_TEMPLATE_LANG = process.env.WA_TEST_TEMPLATE_LANG || 'en_US';
  const WA_DEFAULT_TO = process.env.WA_DEFAULT_TO || '';

  // Safety checks
  if (!WA_ENABLED) {
    return res.status(403).json({ 
      error: 'WhatsApp integration is disabled',
      hint: 'Set WA_ENABLED=true in Vercel environment variables'
    });
  }

  if (WA_MODE !== 'sandbox') {
    return res.status(403).json({ 
      error: 'This endpoint only works in sandbox mode',
      currentMode: WA_MODE
    });
  }

  if (!WA_TEMP_ACCESS_TOKEN) {
    return res.status(400).json({ 
      error: 'Temporary access token not configured',
      hint: 'Generate a temp token in Meta API Testing and add it to WA_TEMP_ACCESS_TOKEN env var'
    });
  }

  if (!WA_TEST_PHONE_NUMBER_ID) {
    return res.status(400).json({ 
      error: 'Test phone number ID not configured',
      hint: 'Add WA_TEST_PHONE_NUMBER_ID to environment variables'
    });
  }

  // Parse request body
  const { to, name, order, date } = req.body || {};
  const recipientPhone = to || WA_DEFAULT_TO;

  if (!recipientPhone) {
    return res.status(400).json({ 
      error: 'Recipient phone number required',
      hint: 'Provide "to" in request body or set WA_DEFAULT_TO env var'
    });
  }

  try {
    // Construct Graph API URL
    const apiUrl = `https://graph.facebook.com/${WA_GRAPH_VERSION}/${WA_TEST_PHONE_NUMBER_ID}/messages`;

    // Build template message payload
    const payload = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'template',
      template: {
        name: WA_TEST_TEMPLATE_NAME,
        language: {
          code: WA_TEST_TEMPLATE_LANG
        }
      }
    };

    // Add template parameters if provided
    if (name || order || date) {
      payload.template.components = [
        {
          type: 'body',
          parameters: [
            name ? { type: 'text', text: name } : { type: 'text', text: 'Test Customer' },
            order ? { type: 'text', text: order } : { type: 'text', text: '#TEST123' },
            date ? { type: 'text', text: date } : { type: 'text', text: new Date().toLocaleDateString() }
          ]
        }
      ];
    }

    console.log('[WhatsApp Send] Sending test message:', {
      to: recipientPhone,
      template: WA_TEST_TEMPLATE_NAME,
      lang: WA_TEST_TEMPLATE_LANG,
      hasParams: !!(name || order || date)
    });

    // Call Graph API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_TEMP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp Send] Error response:', responseData);
      return res.status(response.status).json({
        error: 'Failed to send message',
        details: responseData,
        status: response.status
      });
    }

    console.log('[WhatsApp Send] Message sent successfully:', responseData);

    return res.status(200).json({
      success: true,
      messageId: responseData.messages?.[0]?.id,
      to: recipientPhone,
      response: responseData
    });

  } catch (error) {
    console.error('[WhatsApp Send] Exception:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
