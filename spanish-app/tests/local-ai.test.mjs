import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalAI } from '../local-ai.mjs';
import { createApp } from '../server.mjs';

test('local mode refuses external model hosts', () => {
  assert.throws(() => createLocalAI({ base: 'https://example.com' }), /loopback/);
});
test('local status reports text, voice, and transcription independently', async () => {
  const local = createLocalAI({ upstream: async url => url.endsWith('/api/tags') ? Response.json({ models: [{ name: 'qwen3:4b-instruct-2507-q4_K_M' }] }) : Response.json({ speech: true, transcription: false }) });
  assert.deepEqual(await local.status(), { connected: true, provider: 'ollama', local: true, model: 'qwen3:4b-instruct-2507-q4_K_M', speech: true, transcription: false, message: 'Mateo runs on this computer. No API key needed.' });
});
test('local chat uses schema, uses an instruction model, and handles a missing model', async () => {
  const local = createLocalAI({ upstream: async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:11434/api/chat'); const data = JSON.parse(options.body);
    assert.equal(data.think, undefined); assert.equal(data.stream, false); assert.equal(data.format.type, 'object'); assert.equal(data.messages[0].role, 'system');
    return Response.json({ message: { content: '{"reply":"Hola"}' } });
  } });
  assert.equal(await local.chat('Tutor', [], 'Hello', { type: 'object' }), '{"reply":"Hola"}');
  await assert.rejects(createLocalAI({ upstream: async () => new Response('', { status: 404 }) }).chat('Tutor', [], 'Hola', {}), /local model is unavailable/);
});
test('local speech authenticates worker and forwards audio in memory', async () => {
  const local = createLocalAI({ token: 'private-test-token', upstream: async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:5182/transcribe'); assert.equal(options.headers['X-Habla-Token'], 'private-test-token'); assert.equal(options.headers['Content-Type'], 'audio/webm'); assert.ok(Buffer.isBuffer(options.body)); return Response.json({ text: 'Hola' });
  } });
  assert.equal((await (await local.speech('transcribe', Buffer.from([1]), 'audio/webm')).json()).text, 'Hola');
});
test('Habla local provider never falls back to a cloud API', async () => {
  const reply = { reply: 'Hola', translation: 'Hello', corrected: 'Me llamo Ana.', explanation: 'Use me llamo for your name.' };
  const localAI = { chat: async () => JSON.stringify(reply), status: async () => ({ connected: true, local: true }), speech: async () => new Response(Buffer.from('RIFF'), { headers: { 'Content-Type': 'audio/wav' } }) };
  const server = createApp({ provider: 'ollama', localAI, upstream: () => { throw new Error('Cloud must not be called'); } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const r = await fetch(base + '/api/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'My name is Ana.' }) }); assert.deepEqual(await r.json(), reply);
    const translation = await fetch(base + '/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Hello', direction: 'en-es' }) });
    const translated = await translation.json(); assert.equal(translated.translation, 'Hello'); assert.equal(translated.explanation, ''); assert.equal(translated.corrected, '');
    const speech = await fetch(base + '/api/speech', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'Hola' }) }); assert.equal(speech.headers.get('content-type'), 'audio/wav');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
