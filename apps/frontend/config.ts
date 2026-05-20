// In Next.js, env vars exposed to the browser must start with NEXT_PUBLIC_
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://drawsync-http.onrender.com";
export const WSS_URL = process.env.NEXT_PUBLIC_WS_URL || "https://drawsync-ws-3i15.onrender.com";