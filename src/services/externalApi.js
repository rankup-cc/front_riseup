const EXT_API_BASE = import.meta.env.VITE_RISEUP_API_BASE
  || "https://backend.riseupmotion.com/public/api";
const EXT_API_KEY = import.meta.env.VITE_RISEUP_API_KEY || "";

export async function extApi(path, { method = "GET", body } = {}) {
  const url = `${EXT_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": EXT_API_KEY,          // <<< important
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
