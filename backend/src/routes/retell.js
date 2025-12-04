import express from 'express';
import { proxyRequest } from '../services/retell.js';

const router = express.Router();

// POST /retell/proxy
// Body: { path: string (required), method?: string, body?: any, headers?: object }
// Proxies request to configured Retell API using server-side key. Returns Retell response.
router.post('/proxy', async (req, res) => {
  try {
    const { path, method = 'POST', body = null, headers = {} } = req.body || {};
    if (!path) return res.status(400).json({ error: 'path is required in body' });

    const result = await proxyRequest({ path, method, body, extraHeaders: headers });
    return res.status(result.status >= 100 ? result.status : 200).json({ result: result.data });
  } catch (err) {
    console.error('Retell proxy error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

export default router;
