// In Next.js, env vars exposed to the browser must start with NEXT_PUBLIC_
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const WSS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";