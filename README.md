# Malayalam Music Club

A Malayalam song guessing game with a vintage radio interface, five difficulty
settings, a five-song queue, and a leaderboard on the same page.

## Run locally

Requires Node.js and MySQL. Copy `backend/.env.example` to `backend/.env` and
fill in your database credentials. Run `backend/schema.sql` followed by
`backend/seed.sql` in MySQL to create and populate the database.

Start the API:

```sh
cd backend
npm install
node --env-file=.env server.js
```

In another terminal, start the frontend:

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The API defaults to port 4000.

## Storage and playback

Song titles, movies, and YouTube IDs live in MySQL. The frontend retrieves the
catalog from `GET /songs`; audio streams from YouTube. Name and cumulative
score are saved locally in the browser. Successful guesses are submitted to
`POST /scores`; `GET /leaderboard` returns the fastest guesses per difficulty.

The queue holds five upcoming songs. The player cues the next video between
rounds; YouTube controls buffering and regional playback availability.
Answers and score calculation currently run in the browser.

The seed contains 264 songs. Source and verification records for the 250-song
expansion are in `backend/data/imported-songs.json`. 226 additions passed
YouTube playback metadata and embedding checks; 24 passed oEmbed metadata
checks only. Availability can change.

## Build

Set `VITE_API_URL` to your hosted HTTPS API URL before running `npm run build`
inside `frontend`. Deploy the resulting `dist` directory and host the backend
with its MySQL connection settings. Never commit `.env` credentials.
