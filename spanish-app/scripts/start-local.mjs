import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const ollama = path.join(process.env.LOCALAPPDATA, 'Programs', 'Ollama', 'ollama.exe');
if (!existsSync(ollama)) throw new Error('Install Ollama for Windows first.');
mkdirSync(path.join(root, 'runtime'), { recursive: true });
mkdirSync(path.join(root, 'models', 'ollama'), { recursive: true });
const available = async url => { try { const r = await fetch(url, { signal: AbortSignal.timeout(2000) }); return r.ok ? await r.json() : null; } catch { return null; } };
if (!await available('http://127.0.0.1:11435/api/tags')) {
  const log = openSync(path.join(root, 'runtime', 'ollama.log'), 'a');
  const daemon = spawn(ollama, ['serve'], { detached: true, windowsHide: true, stdio: ['ignore', log, log], env: { ...process.env, OLLAMA_HOST: '127.0.0.1:11435', OLLAMA_MODELS: path.join(root, 'models', 'ollama'), OLLAMA_NO_CLOUD: '1', OLLAMA_MAX_LOADED_MODELS: '1' } });
  daemon.on('error', e => console.error('Could not start Ollama:', e.message)); daemon.unref();
  for (let i = 0; i < 20; i++) { if (await available('http://127.0.0.1:11435/api/tags')) break; await new Promise(resolve => setTimeout(resolve, 1000)); }
}
const existing = await available('http://127.0.0.1:5180/api/status');
if (existing?.provider === 'ollama') console.log('Habla is already running at http://localhost:5180');
else {
  console.log('Open http://localhost:5180. Keep this window open while learning.');
  const server = spawn(process.execPath, ['--env-file-if-exists=.env', 'server.mjs'], { cwd: root, windowsHide: true, stdio: 'inherit' });
  server.on('error', e => console.error(e.message));
  server.on('exit', code => { process.exitCode = code || 0; });
  process.on('SIGINT', () => server.kill()); process.on('SIGTERM', () => server.kill());
}
