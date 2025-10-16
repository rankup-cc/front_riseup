// Base directe vers l’API PHP
export const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://backend.riseupmotion.com/api';

// Appel générique (facile à debugger)
export async function extApi(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const txt = await res.text().catch(() => '');
  const isJSON = (res.headers.get('content-type') || '').includes('application/json');
  const payload = isJSON && txt ? JSON.parse(txt) : txt;
  if (!res.ok) {
    const msg = (payload && payload.error) || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return payload;
}

// Spécifique allures
export async function postTrainingPaces(payload) {
  return extApi('/training/paces', { method: 'POST', body: payload });
}
