'use strict';
/** Calls the Anthropic Messages API. The API key never leaves the server. */
const { API_KEY, MODEL, MOCK } = require('./config');
// ---------- AI ----------
function extractJSON(text) {
  const t = String(text).replace(/```json|```/g, '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('No JSON found');
  return JSON.parse(t.slice(a, b + 1));
}
async function askClaude(prompt) {
  if (MOCK) return { title: 'Mock task', passage: ['A. Mock passage.'], questions: [], overall: 6.5, criteria: [] };
  if (!API_KEY) throw { status: 503, error: 'AI is not configured on this server.' };
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 120000);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctl.signal,
      headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 6000, messages: [{ role: 'user', content: prompt }] })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { console.error('[anthropic]', r.status, j && j.error && j.error.message); throw { status: r.status === 429 ? 429 : 502, error: r.status === 429 ? 'The AI is busy right now. Try again in a minute.' : 'The AI service returned an error. Please try again.' }; }
    const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    try { return extractJSON(text); } catch (e) { throw { status: 502, error: 'Could not read the AI response. Please try again.' }; }
  } catch (e) {
    if (e && e.status) throw e;
    throw { status: 502, error: e && e.name === 'AbortError' ? 'The AI took too long. Please try again.' : 'Could not reach the AI service.' };
  } finally { clearTimeout(to); }
}


module.exports = { askClaude, extractJSON };
