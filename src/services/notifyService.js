// src/services/notifyService.js

// Must use VITE_ prefix for Vite to expose it to the frontend
const NOTIFY_ENABLED =
  String(import.meta.env.VITE_NOTIFY_TYPING_ENABLED ?? 'true').toLowerCase() === 'true';

export async function sendNotify(payload) {
  if (!NOTIFY_ENABLED) return; // Silently skip if disabled
  try {
    await fetch('/api/notify-typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
      keepalive: true,
    });
  } catch {
    // silent
  }
}

export const notifyEnabled = NOTIFY_ENABLED;