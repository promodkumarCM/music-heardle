# Malayalam Music Club

A Malayalam song guessing game with a vintage radio interface, five difficulty
settings, a five-song queue, and a leaderboard on the same page.

## Run locally

Requires Node.js and MySQL. Copy `backend/.env.example` to `backend/.env` and
fill in your database credentials. Run `backend/schema.sql` followed by
`backend/seed.sql` in MySQL to create and populate the database.
Then run `node --env-file=.env migrate-song-years.js` from `backend` (also required
for existing databases). This adds the nullable release year and seeds verified dates.

The radio year tuner offers All and five-year steps from 1990 to 2025. Selecting
1995 includes only release years greater than 1995 and resets the round and queue.
Undated songs appear only under All; populate `songs.release_year` as dates are verified.
The initial year seed covers a subset of the catalog, using film/album release years.
Song guesses are checked on selection or submission. A wrong guess reveals the
answer without awarding points; typing alone never ends a round.

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

The seed contains 264 songs. YouTube availability can change.

## Build

Set `VITE_API_URL` to your hosted HTTPS API URL before running `npm run build`
inside `frontend`. Deploy the resulting `dist` directory and host the backend
with its MySQL connection settings. Never commit `.env` credentials.

## Five Clues (Game 03)

Open `/#clue-game` or choose Five Clues on the home page. Each movie has five
progressive clues in the MySQL `movie_puzzles` table. The seed includes three
starter puzzles: Drishyam, Manichitrathazhu, and Minnal Murali.

Correct guesses earn 100/80/60/40/20 points at clues 1/2/3/4/5. Incorrect guesses
allow another attempt; revealing another clue lowers the available points.
Giving up is available only after the fifth clue and earns zero points.
The API controls clue progression and scoring, and accepts minor spelling
mistakes without exposing movie-name suggestions. Round sessions last two hours
in server memory and reset on an API restart. The visit score resets when leaving
the game; it is separate from the song leaderboard.

For an existing database, run the `CREATE TABLE IF NOT EXISTS movie_puzzles`
statement from `backend/schema.sql` and its `INSERT IGNORE` seed statement from
`backend/seed.sql`.

Five Clues also offers an optional browser timer: off, 10, 20, 30, 45, or 60
seconds per clue. Each revealed clue starts a fresh countdown. Expiry opens the
next clue; after clue five it reveals the answer for zero points. Wrong guesses
do not reset the timer. Players can change or disable it; this is a casual play
option, not a server-enforced competitive time limit.
