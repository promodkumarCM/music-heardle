import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.mjs';
import { lessons, lookup, normalize, streak } from '../public/course.js';

async function withServer(options, run) {
  const server = createApp(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await run(base); } finally { await new Promise(resolve => server.close(resolve)); }
}
const post = (base, route, data, headers = {}) => fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });

test('guided mode serves app and never exposes files outside public allowlist', () => withServer({ apiKey: '' }, async base => {
  assert.deepEqual(await (await fetch(base + '/api/status')).json(), { connected: false, provider: 'openai', local: false, speech: false, transcription: false });
  const home = await fetch(base); assert.match(await home.text(), /Habla/); assert.match(home.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  for (const p of ['/.env', '/server.mjs', '/package.json', '/%2e%2e/.env']) assert.equal((await fetch(base + p)).status, 404);
  const unavailable = await post(base, '/api/tutor', { message: 'Hola' }); assert.equal(unavailable.status, 503); assert.match((await unavailable.json()).error, /OPENAI_API_KEY/);
}));
test('rejects invalid input and cross-origin requests before AI calls', () => withServer({ apiKey: 'test', upstream: () => { throw new Error('must not call'); } }, async base => {
  assert.equal((await post(base, '/api/tutor', { message: '' })).status, 400);
  assert.equal((await post(base, '/api/tutor', { message: 'x'.repeat(2001) })).status, 400);
  assert.equal((await post(base, '/api/tutor', null)).status, 400);
  assert.equal((await post(base, '/api/tutor', { message: 'Hola' }, { Origin: 'https://another-site.example' })).status, 403);
  assert.equal((await fetch(base + '/api/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })).status, 400);
}));
test('tutor sends bounded history and returns corrections from structured output', async () => {
  let sent;
  const answer = { reply: '¡Muy bien! ¿Qué compraste?', translation: 'Very good! What did you buy?', corrected: 'Ayer fui al mercado.', explanation: 'Use fui for went.' };
  await withServer({ apiKey: 'server-only-test-key', upstream: async (url, options) => { assert.equal(url, 'https://api.openai.com/v1/responses'); sent = JSON.parse(options.body); return Response.json({ output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(answer) }] }] }); } }, async base => {
    const r = await post(base, '/api/tutor', { message: 'Ayer voy al mercado', history: [{ role: 'system', content: 'untrusted' }, { role: 'user', content: 'Hola' }], level: 'A2', dialect: 'es-MX' });
    assert.equal(r.status, 200); assert.deepEqual(await r.json(), answer); assert.equal(sent.store, false); assert.equal(sent.input.length, 2); assert.equal(sent.input[0].role, 'user'); assert.match(sent.instructions, /Latin America/); assert.match(sent.instructions, /A2/); assert.equal(sent.text.format.strict, true);
  });
});
test('translation obeys selected direction and does not use conversation history', () => withServer({ apiKey: 'test', upstream: async (url, options) => {
  const sent = JSON.parse(options.body); assert.match(sent.instructions, /into English/); assert.equal(sent.input.length, 1);
  return Response.json({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ reply: 'Hello', translation: 'Hola', corrected: '', explanation: '' }) }] }] });
} }, async base => { const r = await post(base, '/api/translate', { message: 'Hola', direction: 'es-en', history: [{ role: 'user', content: 'ignored' }] }); assert.equal((await r.json()).reply, 'Hello'); }));
test('speech returns audio, transcription uses multipart without storing a recording', () => withServer({ apiKey: 'test', upstream: async (url, options) => {
  if (url.endsWith('/audio/speech')) { const sent = JSON.parse(options.body); assert.equal(sent.voice, 'cedar'); assert.match(sent.instructions, /Speak slowly/); return new Response(new Uint8Array([73, 68, 51]), { headers: { 'Content-Type': 'audio/mpeg' } }); }
  assert.ok(options.body instanceof FormData); assert.equal(options.body.get('file').type, 'audio/webm'); return Response.json({ text: 'Hola, I am learning Spanish.' });
} }, async base => {
  const voice = await post(base, '/api/speech', { text: 'Hola', slow: true }); assert.equal(voice.headers.get('content-type'), 'audio/mpeg'); assert.equal((await voice.arrayBuffer()).byteLength, 3);
  const transcript = await fetch(base + '/api/transcribe', { method: 'POST', headers: { 'Content-Type': 'audio/webm' }, body: new Uint8Array([1, 2, 3]) }); assert.equal((await transcript.json()).text, 'Hola, I am learning Spanish.');
  assert.equal((await fetch(base + '/api/transcribe', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'bad' })).status, 400);
}));
test('provider errors and malformed replies become clear recoverable errors', async () => {
  for (const [reply, status] of [[new Response('{}', { status: 429 }), 429], [Response.json({ output: [] }), 502]]) {
    await withServer({ apiKey: 'test', upstream: async () => reply }, async base => { const r = await post(base, '/api/tutor', { message: 'Hola' }); assert.equal(r.status, status); assert.ok((await r.json()).error); });
  }
});
test('curriculum recall, two-way phrase lookup, and local calendar streaks', () => {
  assert.equal(lessons.length, 14); assert.equal(new Set(lessons.map(l => l.id)).size, 14);
  for (const lesson of lessons) { assert.ok(lesson.answers[lesson.correct]); assert.ok(lesson.phrases.length >= 4); }
  assert.equal(normalize('¡Hola, cómo estás!'), 'hola como estas');
  assert.equal(lookup('My name is Alex.', 'en-es').es, 'Me llamo Alex.');
  assert.equal(lookup('Me llamo Alex.', 'es-en').en, 'My name is Alex.');
  assert.equal(lookup('Unlisted phrase', 'en-es'), undefined);
  assert.equal(streak(['2026-10-01', '2026-10-02'], new Date(2026, 9, 3)), 2);
  assert.equal(streak(['2026-10-01'], new Date(2026, 9, 3)), 0);
  assert.equal(streak(['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03'], new Date(2026, 9, 3)), 4);
});
