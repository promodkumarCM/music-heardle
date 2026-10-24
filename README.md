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

## Missing Lyrics (Game 04)

Open `/#lyrics-game`. The starter catalog uses three complete sections from the
user-supplied lyrics. Each round chooses two sections and hides 2–3 words per
section. Correct words earn 10 points, wrong or revealed words earn zero, and
attempts cannot be repeated. Malayalam Unicode and punctuation are normalized;
transliteration and approximate spelling are not supported for missing words.

Host mode lets one operator mark Team A and Team B before revealing. Reveals
settle any unmarked attempts at zero. Online mode uses shared room codes with
multiple members per team, identical blanks, server-authoritative attempts and
team-private reveals. Updates poll every 1.5 seconds. Either team may start the
next round once both finish. Scores are per round. Membership tokens are stored
in sessionStorage to reconnect on refresh. Room codes allow joining either team;
this is a casual game without accounts or competitive identity verification.

Rooms live in server memory for six hours and reset on restart. Run one API
instance. On another device, open a reachable LAN/hosted frontend address, not
localhost. The lyrics API defaults to the frontend hostname on port 4000;
set VITE_API_URL for a deployed API. For LAN testing, start Vite with --host
0.0.0.0 and allow the frontend/API ports through the local firewall as needed.

Lyrics update: show all supplied stanzas and refrains in their original order,
masking words in only two randomly selected main stanzas. The pasted non-lyric
shopping text after the final stanza is omitted. Host mode awards each word only
to the first correct team and automatically locks the other team out. Online
teams continue to answer independently. Restarting the API clears existing rooms.

Host reveal controls now preview words without settling scores. Click a blank
for its reveal, or use Reveal next / Reveal all; then award the first correct
team. If nobody answered correctly, mark both teams missed. Online reveals
still settle the requesting team's word at zero.

Host reveal flow: after every reveal, choose Team A, Team B, or Neither before
another reveal is permitted. This is enforced by the API as well as the UI.
Reveal all remains available only in online mode, where it affects one team.

## Admin panel

Open Admin at the bottom-right of the home page, or `/#admin`. The local login
is username `admin`, password `admin`. Manage songs, dialogues, five-clue movies,
and lyrics with searchable lists and add, edit, and confirmed delete actions.
All catalog changes persist in MySQL. Existing rounds keep their current content;
start another round or reload the song game to load catalog updates.

Before starting an existing or fresh backend, run this once from `backend`:

```sh
node --env-file=.env migrate-admin.js
```

This creates the lyrics catalog and seeds the four supplied songs once. Rerunning
it does not restore entries deleted through Admin. Lyric sections are separated
by blank lines in the editor; movie clues require exactly five lines.

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the backend environment to change
the credentials. For public deployment use HTTPS, set `NODE_ENV=production`, and
set a private `ADMIN_PASSWORD`: production rejects the default `admin` password.
Admin endpoints require authentication. Sessions expire after two hours and are
cleared when the backend restarts; logging out revokes the current session.

## Song answer privacy

Guess the Song now uses `/song-game/queue` and opaque two-hour round tokens.
Active rounds expose only the token, YouTube playback ID, and status. The server
checks typed guesses and returns the title/movie only when that round ends.
Autocomplete was removed because it required an answer catalog in the browser.
The queue maintains up to five upcoming songs without their answer metadata.

`GET /songs`, `GET /movies`, and direct `POST /scores` return 410. Admin catalog
access still requires authentication. Song leaderboard entries are written once
per correct round using server timing and the lowest difficulty weight played
during that round. Displayed local visit totals remain a convenience, not an
authenticated tournament score. YouTube IDs and video metadata remain inspectable;
external song recognition, repeated new rounds, and automation are still possible.
Deploy frontend and backend together. Restarting the backend expires active rounds.
Run `node --test songGame.test.js` to verify answer privacy and score replay checks.

## Host + buzzer

The home page also has a separate **Team Buzzer** card. It defaults to Standalone
Buzzer: ask your own questions aloud, award 100 points for a correct answer, or
finish a question without points. This mode needs no game catalog or database
content. Team invitations, timers, lockouts, undo, and cumulative scores work
the same way as the integrated game modes.

Choose Host + buzzer on the home page or in Missing Lyrics, or open `/#buzzer-game`.
This is separate from the existing host-only and online typing modes. It supports
Missing Lyrics, Guess the Movie, Five Clues, and Guess the Song.

The host selects 2–8 uniquely named teams, 1–20 players per team, and a 5–120 second
answer window. Share a team invitation link to assign joining players directly,
or share the room link/code and assign players in the lobby. The host can remove
players and lock joining. All players must be assigned, and each team must have
at least one player before starting. Teams remain fixed during play.

The host opens buzzing explicitly. The first request received by the server locks
the buzzer for everyone and starts the answer timer. Players answer aloud. The
host can privately check the answer, mark correct/wrong, and reopen buzzing for
remaining teams after a wrong answer or timeout. A team gets one attempt per
question. Public reveal ends the question without points. Undo restores the last
manual scoring/reveal decision, but cannot make players forget a shown answer.

Lyrics uses a host-selected blank per question worth 10 points. Dialogue and song
questions award 100 points; Five Clues awards 100/80/60/40/20 according to the
current clue. Song playback is on the host device using a YouTube embed. Scores
accumulate within the room, including when unanswered questions are skipped.

For phones on the same Wi-Fi, start Vite with `--host 0.0.0.0` and open the host
computer's LAN address on the host device before copying invitation links. Do not
share localhost/127.0.0.1 links with other devices. The API port (4000 by default)
and frontend port must be reachable. For deployment set VITE_API_URL and use HTTPS.

Room and player tokens live in sessionStorage, so refresh reconnects the same tab.
Rooms expire after six hours and disappear on server restart. Use one backend
instance; room state is in memory. Updates poll every 350 ms; server arrival order
settles races, but network latency can affect fairness. This is casual play, not
a secure tournament system: the other existing game APIs expose some catalog
answers. Keep the host token and private answer display private.

Checks: `node --test buzzer.test.js` from backend; with the API running,
`node --test buzzer-api.test.js` exercises all catalogs and a 12-player room.

## Picture Clues image uploads (Railway)

Admin → Picture Clues accepts a laptop/desktop image and an optional mobile image for the same movie. Upload each image, then click Create entry or Save changes. Leaving mobile empty uses the desktop image. Existing image URLs still work.

Images are stored as files on the backend; their URLs are saved in the existing `picture_puzzles.image_url` and `mobile_image_url` columns. No database migration is needed.

For persistent Railway storage:
1. Attach a Railway volume to the **backend service**, mounted at `/data`.
2. Set `UPLOAD_DIR=/data/picture-clues` on that backend service and redeploy.
3. Keep `VITE_API_URL` pointing to the publicly reachable backend HTTPS URL.
4. Configure a private `ADMIN_PASSWORD` for production.

Local development defaults to `uploads/picture-clues` relative to the backend working directory. Production uploads are refused unless `UPLOAD_DIR` is configured. Setting the variable alone does not create a Railway volume. Back up the volume along with the database. Replaced or unused uploads are retained; deleting a catalog record does not delete files.

The authenticated upload endpoint accepts PNG/JPEG/WebP file bodies up to 8 MB, checks file signatures and generates opaque filenames. Uploaded clue images are publicly readable. Do not upload private files. SVG and HTML uploads are rejected.
