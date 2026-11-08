// Email verification and password reset tests (npm test runs this too)
const os = require('os'), fs = require('fs'), path = require('path'), assert = require('assert');
process.env.MAIL_MODE = 'capture'; process.env.REQUIRE_VERIFY = 'true'; process.env.SECRET = 'test-secret';
process.env.PUBLIC_URL = 'http://site.test'; process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ielts-acc-'));
const { createApp, flush } = require('../server');
const { outbox } = require('../src/mailer');
const srv = createApp();
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const call = async (p, o = {}, t) => { const r = await fetch(base + p, { redirect: 'manual', ...o, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) } }); let j = {}; try { j = await r.json(); } catch (e) {} return { s: r.status, j, h: r.headers }; };
  const post = (p, b, t) => call(p, { method: 'POST', body: JSON.stringify(b) }, t);
  try {
    let r = await post('/api/signup', { name: 'Ann', email: 'ann@example.com', password: 'firstpass1' });
    assert.strictEqual(r.s, 201); assert.strictEqual(r.j.needsVerify, true); assert.ok(!r.j.token);
    assert.strictEqual(outbox.length, 1);
    r = await post('/api/login', { email: 'ann@example.com', password: 'firstpass1' });
    assert.strictEqual(r.s, 403); assert.strictEqual(r.j.code, 'unverified');
    const vtok = outbox[0].text.match(/token=([a-f0-9]{64})/)[1];
    r = await call('/api/verify?token=bad'); assert.strictEqual(r.s, 302); assert.ok(r.h.get('location').includes('verify_error'));
    r = await call('/api/verify?token=' + vtok); assert.strictEqual(r.s, 302); assert.ok(r.h.get('location').includes('verified=1'));
    r = await post('/api/login', { email: 'ann@example.com', password: 'firstpass1' });
    assert.strictEqual(r.s, 200); const oldTok = r.j.token;
    assert.strictEqual((await call('/api/me', {}, oldTok)).s, 200);
    // forgot password: unknown email gives the same answer and sends nothing
    const before = outbox.length;
    r = await post('/api/forgot', { email: 'nobody@example.com' }); assert.strictEqual(r.s, 200); assert.strictEqual(outbox.length, before);
    r = await post('/api/forgot', { email: 'ann@example.com' }); assert.strictEqual(r.s, 200); assert.strictEqual(outbox.length, before + 1);
    const rtok = outbox[outbox.length - 1].text.match(/\?reset=([a-f0-9]{64})/)[1];
    assert.strictEqual((await post('/api/reset', { token: 'nope', password: 'newpass123' })).s, 400);
    assert.strictEqual((await post('/api/reset', { token: rtok, password: 'short' })).s, 400);
    assert.strictEqual((await post('/api/reset', { token: rtok, password: 'newpass123' })).s, 200);
    assert.strictEqual((await post('/api/reset', { token: rtok, password: 'another123' })).s, 400);       // link works once
    assert.strictEqual((await call('/api/me', {}, oldTok)).s, 401);                                         // old sessions end
    assert.strictEqual((await post('/api/login', { email: 'ann@example.com', password: 'firstpass1' })).s, 401);
    r = await post('/api/login', { email: 'ann@example.com', password: 'newpass123' }); assert.strictEqual(r.s, 200); const t2 = r.j.token;
    // change password while signed in
    const put = (p, b, tk) => call(p, { method: 'PUT', body: JSON.stringify(b) }, tk);
    assert.strictEqual((await put('/api/password', { current: 'wrong-pass1', password: 'brandnew123' }, t2)).s, 400);
    assert.strictEqual((await put('/api/password', { current: 'newpass123', password: 'short' }, t2)).s, 400);
    assert.strictEqual((await put('/api/password', { current: 'newpass123', password: 'newpass123' }, t2)).s, 400);
    assert.strictEqual((await call('/api/password', { method: 'PUT', body: '{}' })).s, 401);
    r = await put('/api/password', { current: 'newpass123', password: 'brandnew123' }, t2); assert.strictEqual(r.s, 200);
    assert.strictEqual((await call('/api/me', {}, t2)).s, 401);                      // old session ended
    assert.strictEqual((await call('/api/me', {}, r.j.token)).s, 200);               // returned token works
    assert.strictEqual((await post('/api/login', { email: 'ann@example.com', password: 'newpass123' })).s, 401);
    r = await post('/api/login', { email: 'ann@example.com', password: 'brandnew123' }); assert.strictEqual(r.s, 200); const t3 = r.j.token;
    // delete account
    assert.strictEqual((await post('/api/delete-account', { password: 'wrong-pass1' }, t3)).s, 400);
    assert.strictEqual((await post('/api/delete-account', { password: 'brandnew123' }, t3)).s, 200);
    assert.strictEqual((await call('/api/me', {}, t3)).s, 401);
    assert.strictEqual((await post('/api/login', { email: 'ann@example.com', password: 'brandnew123' })).s, 401);
    flush(); console.log('Account recovery tests passed'); srv.close(); process.exit(0);
  } catch (e) { console.error('TEST FAILED:', e); process.exit(1); }
});
