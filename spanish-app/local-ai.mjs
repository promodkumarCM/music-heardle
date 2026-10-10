import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const fail = (status, message) => Object.assign(new Error(message), { status });
export function createLocalAI({ upstream = fetch, model = process.env.OLLAMA_MODEL || 'qwen3:4b-instruct-2507-q4_K_M', base = process.env.OLLAMA_URL || 'http://127.0.0.1:11434', speechBase = 'http://127.0.0.1:5182', token = process.env.HABLA_SPEECH_TOKEN || '' } = {}) {
  for (const address of [base, speechBase]) {
    const url = new URL(address);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.protocol !== 'http:') throw new Error('Local AI services must use loopback HTTP addresses.');
  }
  let generating = false;
  return {
    async status() {
      const [models, speech] = await Promise.allSettled([
        upstream(base + '/api/tags', { signal: AbortSignal.timeout(2500) }).then(r => r.ok ? r.json() : Promise.reject()),
        upstream(speechBase + '/status', { headers: { 'X-Habla-Token': token }, signal: AbortSignal.timeout(2500) }).then(r => r.ok ? r.json() : Promise.reject()),
      ]);
      const installed = models.status === 'fulfilled' && models.value.models?.some(m => m.name === model || m.model === model);
      return { connected: Boolean(installed), provider: 'ollama', model, local: true, speech: speech.status === 'fulfilled' && Boolean(speech.value.speech), transcription: speech.status === 'fulfilled' && Boolean(speech.value.transcription), message: installed ? 'Mateo runs on this computer. No API key needed.' : 'Start Ollama and download ' + model + ' to connect Mateo.' };
    },
    async chat(instructions, history, message, schema) {
      if (generating) throw fail(429, 'Mateo is still finishing a reply. Please try again in a moment.');
      generating = true;
      try {
        const r = await upstream(base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(180000), body: JSON.stringify({ model, stream: false, keep_alive: '2m', format: schema, options: { temperature: 0.2, num_ctx: 2048, num_batch: 32, num_gpu: 0, num_thread: 4, num_predict: 300 }, messages: [{ role: 'system', content: instructions + '\nReturn exactly the requested JSON object. Keep explanations to one short sentence. Never include reasoning or markdown.' }, ...history.slice(-4).map(m => ({ ...m, content: m.content.slice(0, 400) })), { role: 'user', content: message }] }) });
        if (!r.ok) throw fail(503, 'The local model is unavailable. Open Ollama and check that ' + model + ' is downloaded.');
        const result = await r.json(); return result.message?.content;
      } catch (e) { if (e.status) throw e; throw fail(504, 'The local tutor did not reply in time. Check Ollama and try a shorter message.'); }
      finally { generating = false; }
    },
    async speech(route, data, type = 'application/json') {
      try {
        const r = await upstream(speechBase + '/' + route, { method: 'POST', headers: { 'Content-Type': type, 'X-Habla-Token': token }, body: type === 'application/json' ? JSON.stringify(data) : data, signal: AbortSignal.timeout(120000) });
        if (!r.ok) { const payload = await r.json(); throw fail(r.status, payload.error || 'Local speech is unavailable.'); }
        return r;
      } catch (e) { if (e.status) throw e; throw fail(503, 'Local speech is not ready. Restart Habla and check the speech model installation.'); }
    },
  };
}

export function startSpeechWorker(token) {
  const directory = fileURLToPath(new URL('.', import.meta.url));
  const python = path.join(directory, '.venv', 'Scripts', 'python.exe');
  if (!existsSync(python)) { console.log('Local speech environment is not installed. Text chat is still available.'); return null; }
  const child = spawn(python, ['-u', path.join(directory, 'speech_server.py')], { cwd: directory, windowsHide: true, env: { ...process.env, HABLA_SPEECH_TOKEN: token, HF_HUB_OFFLINE: '1', HF_HUB_DISABLE_TELEMETRY: '1' }, stdio: ['ignore', 'inherit', 'inherit'] });
  child.on('error', () => console.log('Local speech worker could not start.'));
  return child;
}
