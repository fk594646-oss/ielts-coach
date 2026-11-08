'use strict';
/** Sends email. Modes: resend (real emails), console (prints them, for local testing), capture (tests). */
const { RESEND_API_KEY, MAIL_MODE, MAIL_FROM } = require('./config');
const outbox = [];
async function sendMail({ to, subject, text, html }) {
  if (MAIL_MODE === 'capture') { outbox.push({ to, subject, text }); return; }
  if (MAIL_MODE === 'resend') {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, text, html })
    });
    if (!r.ok) { console.error('[mail] sending failed with status', r.status); throw new Error('mail failed'); }
    return;
  }
  console.log('\n[email:console] To: ' + to + '\nSubject: ' + subject + '\n' + text + '\n');
}
const layout = (title, body, label, link) => '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1f2430"><h2 style="margin:0 0 12px">' + title + '</h2><p style="line-height:1.6">' + body + '</p><p><a href="' + link + '" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">' + label + '</a></p><p style="color:#6b7080;font-size:13px">If the button does not work, copy this link into your browser:<br>' + link + '</p></div>';
module.exports = { sendMail, layout, outbox };
