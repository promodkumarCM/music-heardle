"""Local-only voice worker. Raw audio lives in memory, never in files or logs."""
import hmac
import gc
import io
import json
import os
import threading
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
from faster_whisper import WhisperModel
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent / 'models'
TOKEN = os.environ.get('HABLA_SPEECH_TOKEN', '')
VOICES = {'es': ROOT / 'es_ES-davefx-medium.onnx', 'en': ROOT / 'en_US-ryan-medium.onnx'}
lock = threading.Lock()
voices = {}
whisper = None

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def respond(self, status, data, content_type='application/json'):
        encoded = json.dumps(data).encode() if content_type == 'application/json' else data
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(encoded)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(encoded)

    def authorized(self):
        return bool(TOKEN) and hmac.compare_digest(self.headers.get('X-Habla-Token', ''), TOKEN)

    def do_GET(self):
        if not self.authorized():
            return self.respond(403, {'error': 'Forbidden'})
        if self.path != '/status':
            return self.respond(404, {'error': 'Not found'})
        return self.respond(200, {
            'speech': all(p.exists() and Path(str(p) + '.json').exists() for p in VOICES.values()),
            'transcription': (ROOT / 'whisper-base' / 'model.bin').exists(),
        })

    def do_POST(self):
        global whisper
        if not self.authorized():
            return self.respond(403, {'error': 'Forbidden'})
        if self.path not in ['/speech', '/transcribe']:
            return self.respond(404, {'error': 'Not found'})
        try:
            size = int(self.headers.get('Content-Length', 0))
            if size <= 0 or size > 8 * 1024 * 1024:
                return self.respond(413, {'error': 'Invalid request size'})
            data = self.rfile.read(size)
            if not lock.acquire(blocking=False):
                return self.respond(429, {'error': 'Voice is busy. Please try again in a moment.'})
            try:
                if self.path == '/speech':
                    payload = json.loads(data)
                    text = payload.get('text', '')
                    if not isinstance(text, str) or not text.strip() or len(text) > 3000:
                        return self.respond(400, {'error': 'Enter 1–3000 characters.'})
                    language = 'en' if payload.get('language') == 'en' else 'es'
                    if language not in voices:
                        voices[language] = PiperVoice.load(str(VOICES[language]))
                    output = io.BytesIO()
                    with wave.open(output, 'wb') as wav:
                        voices[language].synthesize_wav(text, wav, syn_config=SynthesisConfig(length_scale=1.18 if payload.get('slow') else 1.0))
                    return self.respond(200, output.getvalue(), 'audio/wav')
                if whisper is None:
                    whisper = WhisperModel(str(ROOT / 'whisper-base'), device='cpu', compute_type='int8', cpu_threads=4, local_files_only=True)
                segments, _info = whisper.transcribe(io.BytesIO(data), beam_size=3, vad_filter=True, condition_on_previous_text=False, initial_prompt='Hola. Hello. Spanish and English conversation.')
                transcript = ' '.join(s.text.strip() for s in segments).strip()
                if not transcript:
                    return self.respond(422, {'error': 'No clear speech was heard. Please try again.'})
                return self.respond(200, {'text': transcript})
            finally:
                # Keep RAM available for the language model on a 16 GB laptop.
                voices.clear()
                whisper = None
                gc.collect()
                lock.release()
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception as exc:
            # No recordings, transcripts, or request payloads are logged.
            print('Voice worker error: ' + type(exc).__name__, flush=True)
            self.respond(500, {'error': 'Local speech could not complete this request. Check installed speech models and try again.'})

if __name__ == '__main__':
    if not TOKEN:
        raise SystemExit('Start speech through Habla so it receives a private worker token.')
    server = ThreadingHTTPServer(('127.0.0.1', int(os.environ.get('HABLA_SPEECH_PORT', '5182'))), Handler)
    print('Local speech worker ready.', flush=True)
    server.serve_forever()
