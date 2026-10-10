# Habla — Spanish practice on your laptop

Habla is configured to run the tutor, transcription, and speech locally. No paid API key or online hosting is needed. The Malayalam Heardle application is unchanged.

## Start

Double-click **Start Habla.cmd**, then open **http://localhost:5180**. Keep the server window open while learning. The launcher starts Habla's Ollama service if necessary. If that service is already running, `npm start` also works.

In **Talk to Mateo**, type or tap **Tap to speak**. Allow microphone access, stop recording, check the transcript, and send it. Replies play aloud when autoplay is enabled.

## Local services

| Component | Model/software | Address |
| --- | --- | --- |
| App | Node.js and browser JavaScript | 127.0.0.1:5180 |
| Tutor and translation | Ollama, Qwen3 4B Instruct 2507 Q4_K_M | 127.0.0.1:11435 |
| Spanish voice | Piper, es_ES-davefx-medium | Private worker on 127.0.0.1:5182 |
| English voice | Piper, en_US-ryan-medium | Same worker |
| Transcription | faster-whisper multilingual base, CPU int8 | Same worker |

The app starts its Python speech worker with a random per-run token. Browsers talk only to Habla. Local mode never falls back to a cloud provider. Ollama is launched with cloud features disabled.

Models are stored under **D:\Projects\malayalam-heardle\spanish-app\models** because C: did not have enough room. Python packages are in `.venv`; runtime logs are in `runtime`. These folders are ignored by Git. Ollama itself is installed in the current Windows user's application directory.

The model uses 2,048 context tokens, batch size 32, CPU inference, and four threads to fit this laptop's memory. Only the last four conversation messages, shortened to 400 characters each, are used as history. Real-model tests on this laptop took about 13–33 seconds per text response. Speech generation and transcription also take a few seconds. Voice models are released after each request, and the language model unloads after two idle minutes to reduce memory use. This is turn-based practice, not simultaneous real-time conversation. Smaller local models can still make language mistakes.

The installed Spanish voice has a Spain accent; the Spain/Latin America setting changes the tutor's wording, not that voice. Speech recognition can be imperfect, especially when mixing languages: edit the transcript before sending. Pronunciation is not scored from transcripts.

## Privacy

After downloads, inference uses local files. The speech worker disables Hugging Face network access. Raw recordings stay in memory and are not saved or logged. Progress, preferences, phrases, and corrections use browser local storage. Chats stay in memory only. There is no account or cross-device sync.

All services bind to loopback. This personal app has no user authentication: add authentication, HTTPS, per-user quotas, and durable storage before public hosting.

## Learning features

Fourteen introductory lessons cover A1–B2 topics (eight A1 lessons, two each at A2/B1/B2), with phrases, comprehension questions, recall checks, and speaking prompts. This is a starter curriculum, not a full CEFR course or certification.

Also included: immediate or end-of-chat corrections, translation both ways, phrase saving, next-day flashcards, activity streaks, slower speech, and calendar reminders. Import the downloaded `.ics` file into your calendar to activate notifications. Habla does not send background push notifications.

## Recreate the installation

Requires Node.js 22+, Python 3.12, and Ollama for Windows.

1. Create `.venv` with Python and install `requirements.txt` with its pip.
2. Run `.venv\Scripts\python.exe scripts\download-speech.py` once.
3. Copy `.env.example` to `.env` only if no configuration exists. Set `AI_PROVIDER=ollama`.
4. Run `Start Habla.cmd`.
5. Download the model to that service by setting `OLLAMA_HOST=127.0.0.1:11435` and running `ollama pull qwen3:4b-instruct-2507-q4_K_M`.

PyAV is pinned to 16.0.1: PyAV 19 removed an argument used by faster-whisper 1.2.1. Never commit models or `.env`.

Legacy cloud support is available only with explicit `AI_PROVIDER=openai` configuration and an API key. This installation uses local mode.

## Verify

```powershell
npm test
npm run check
node scripts/smoke-local.mjs
```

Unit tests cover routing, no cloud fallback in local mode, request validation, origin checks, missing models, output parsing, speech forwarding, and curriculum logic. The smoke script runs the real local models: synthetic Spanish speech, transcription, sentence correction, translation both ways, and English speech. It records no microphone audio and saves no audio files. Testing your own microphone and voice remains a user trial.

## References and licenses

- [Ollama for Windows](https://docs.ollama.com/windows)
- [Qwen3 4B Instruct](https://ollama.com/library/qwen3:4b-instruct-2507-q4_K_M): Apache 2.0.
- [Piper](https://github.com/OHF-Voice/piper1-gpl): GPL-3.0 engine.
- [Spanish Davefx voice](https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/davefx/medium): model card identifies a CC0 dataset.
- [English Ryan voice](https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ryan/medium): model card identifies CC BY-NC-SA 4.0 dataset terms. This setup is for personal learning; review voice licensing before commercial redistribution.
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper): local transcription.

Voice model cards are retained beside the downloaded models.
