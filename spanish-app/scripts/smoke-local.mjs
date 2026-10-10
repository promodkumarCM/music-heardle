import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:5180';
async function request(route, data, type = 'application/json') {
  const start = Date.now();
  const r = await fetch(base + '/api/' + route, { method: 'POST', headers: { 'Content-Type': type }, body: type === 'application/json' ? JSON.stringify(data) : data, signal: AbortSignal.timeout(190000) });
  if (!r.ok) throw new Error(`${route}: ${r.status} ${await r.text()}`);
  const result = route === 'speech' ? await r.arrayBuffer() : await r.json();
  console.log(route, Date.now() - start, 'ms', route === 'speech' ? `${result.byteLength} bytes` : result);
  return result;
}
const status = await (await fetch(base + '/api/status')).json();
assert.equal(status.local, true); assert.equal(status.connected, true); assert.equal(status.speech, true); assert.equal(status.transcription, true);
console.log('Ready:', status);
const voice = await request('speech', { text: 'Hola. Me llamo Mateo. Estoy aprendiendo español.', language: 'es', slow: true });
assert.ok(voice.byteLength > 1000);
const transcription = await request('transcribe', voice, 'audio/wav');
assert.match(transcription.text.toLowerCase(), /hola|mateo|espa/);
const correction = await request('tutor', { message: 'Ayer yo ir al mercado.', level: 'A1', dialect: 'es-ES', history: [] });
assert.ok(correction.corrected); assert.ok(correction.explanation);
const spanish = await request('translate', { message: 'I would like a glass of water, please.', direction: 'en-es' });
assert.match(spanish.reply.toLowerCase(), /agua/);
const english = await request('translate', { message: 'Tengo hambre y quiero comer algo.', direction: 'es-en' });
assert.match(english.reply.toLowerCase(), /hungry|hunger/);
await request('speech', { text: english.reply, language: 'en' });
console.log('Local speech, transcription, correction, and both translation directions passed.');
