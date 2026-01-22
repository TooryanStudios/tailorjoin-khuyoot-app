/**
 * WhatsApp Health Check Endpoint
 * 
 * Simple endpoint to verify WhatsApp integration is reachable.
 * Useful for testing preview deployments.
 */

export default async function handler(req, res) {
  const WA_ENABLED = process.env.WA_ENABLED === 'true';
  const WA_MODE = process.env.WA_MODE || 'disabled';
  const WA_GRAPH_VERSION = process.env.WA_GRAPH_VERSION || 'v22.0';

  return res.status(200).json({
    ok: true,
    mode: WA_MODE,
    enabled: WA_ENABLED,
    graphVersion: WA_GRAPH_VERSION,
    timestamp: new Date().toISOString()
  });
}
