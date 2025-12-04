import { RETELL_API_KEY, RETELL_BASE_URL, RETELL_AUTH_SCHEME } from '../config.js';

// Simple wrapper to proxy requests to the Retell AI API using server-side API key.
// This avoids embedding the key in front-end code. It intentionally is generic so
// you can call any Retell path (e.g. /v1/narrate) by passing `path` from the client.
export async function proxyRequest({ path, method = 'POST', body = null, extraHeaders = {} }) {
  if (!path) throw new Error('path is required');

  // Ensure path begins with '/'
  const safePath = path.startsWith('/') ? path : `/${path}`;
  const url = `${RETELL_BASE_URL}${safePath}`;

  const headers = { ...extraHeaders, Accept: 'application/json' };
  if (body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  // Attach API key using configured scheme. If RETELL_AUTH_SCHEME is empty, use x-api-key header.
  if (RETELL_API_KEY) {
    if (RETELL_AUTH_SCHEME && RETELL_AUTH_SCHEME.length) {
      headers['Authorization'] = `${RETELL_AUTH_SCHEME} ${RETELL_API_KEY}`;
    } else {
      headers['x-api-key'] = RETELL_API_KEY;
    }
  }

  const opts = {
    method,
    headers,
  };

  if (body) {
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const res = await fetch(url, opts);

  // Try to parse JSON, otherwise return text
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    return { status: res.status, data };
  }

  const text = await res.text();
  return { status: res.status, data: text };
}

export default { proxyRequest };
