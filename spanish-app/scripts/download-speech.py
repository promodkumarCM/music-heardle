"""One-time model download. Inference never downloads or sends user audio online."""
from pathlib import Path
import os
from urllib.request import urlretrieve

ROOT = Path(__file__).resolve().parents[1] / 'models'
ROOT.mkdir(exist_ok=True)
os.environ['HF_HOME'] = str(ROOT / 'huggingface-cache')
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
from faster_whisper.utils import download_model
voices = {
    'es_ES-davefx-medium': 'es/es_ES/davefx/medium',
    'en_US-ryan-medium': 'en/en_US/ryan/medium',
}
for name, folder in voices.items():
    for suffix in ['.onnx', '.onnx.json']:
        target = ROOT / (name + suffix)
        if not target.exists():
            print('Downloading ' + target.name, flush=True)
            partial = target.with_suffix(target.suffix + '.partial')
            urlretrieve(f'https://huggingface.co/rhasspy/piper-voices/resolve/main/{folder}/{name}{suffix}', partial)
            partial.replace(target)
    card = ROOT / (name + '.MODEL_CARD')
    if not card.exists():
        urlretrieve(f'https://huggingface.co/rhasspy/piper-voices/resolve/main/{folder}/MODEL_CARD', card)
print('Downloading multilingual Whisper base', flush=True)
download_model('base', output_dir=str(ROOT / 'whisper-base'))
print('Speech models are ready.', flush=True)
