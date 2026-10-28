# Malayalam Music Club

## Fresh stock and actor photo collections

Actor Admin accepts up to 20 photos per actor (8 MB each). Save the actor to apply
the collection to all their characters. Each round chooses a random photo,
avoiding the last photo for that actor when another is available. Existing single
photos remain usable. Run backend/migrate-characters.js with the backend environment
to add the nullable actor_image_urls column before deploying the updated API.

Game rounds use shuffled, non-repeating stock. Movie and character clues are
separated when alternatives remain; when only one movie remains, consecutive
clues from it are unavoidable. Stock ends instead of automatically restarting.
The finished screen invites players to contribute clues or support with porotta.
Room stock is tracked per game, including across game switches; starting a new
room starts a new playthrough. Solo pictures/dialogues use their loaded set.
Solo songs and Five Clues track stock per browser-tab session on the API for up
to two hours of inactivity. API restarts clear in-memory stock histories.


## Character Files — Cast Dossier

The fourteen-actor filmography catalog is in `backend/data/character-filmographies.json`,
with source URLs and an excluded-record list. It covers Mohanlal, Mammootty,
Dileep, Jayaram, Kunchacko Boban, Prithviraj Sukumaran, Asif Ali, Suresh Gopi,
Fahadh Faasil, Dulquer Salmaan, Nivin Pauly, Tovino Thomas, Naslen, and Basil Joseph
across languages.
Character names use the source's English transliterations. Unreleased or uncertain
projects and missing character names are excluded; the source is community maintained.
From `backend`, preview with `node --env-file=.env import-character-filmographies.js`,
then append with `node --env-file=.env import-character-filmographies.js --apply`.
The importer preserves existing pairs and photos, records conflicting actors,
backs up existing rows under `output/character-import`, and commits atomically.
Rerunning skips imported pairs. Source snapshots were retrieved on 28 October 2026.

Admin groups Character Files by actor. Enter the actor and upload a shared photo
once, then use **Add character and movie** for each character/movie pair. Saved
pairs appear in a table with **Edit** and **Delete**. Edit loads the selected row
into one set of text boxes; **Save character changes** updates it. Actor details
can be saved separately. Changes save atomically; invalid or duplicate pairs save nothing.
Each pair remains a separate game clue, using the same actor photo. Existing
catalog entries are grouped automatically, with no database migration required.

The sixth game first shows a film's **character name**, and players identify
the movie. Its paper casting-file theme uses a character-name label and bilingual
name controls. Solo, Host and Buzzer use the shared setup, room lifecycle, answer
matching, scores and buzzer timer. There is no difficulty selection for this game.
Every round shows the character and saved actor photo for 100 points.
**Reveal actor name**, below the photo, optionally reveals the name and lowers
the round to 60 points. In Buzzer mode,
only the creator reveals this shared hint while buzzers are open. The actor name stays server-side until hinted or settled. Reveals reset each round.
Revealing the movie earns zero.
The movie answer stays server-side until settlement, except for the host's
answer check. Players can contribute suggestions for admin review.

Before using it with an existing database, run from `backend`:
`node --env-file=.env migrate-characters.js`. This creates the catalog and adds the actor-name and optional photo columns to existing installations without
changing existing entries. Add verified content through **Admin → Character Files**:
movie, actor name, optional actor photo upload, character name, optional English name, movie aliases. Multiple characters can belong to the same movie. Actor photos accept PNG, JPEG or
WebP files up to 8 MB, show a preview, and use the existing persistent image-upload
storage. Save the entry after uploading. Removing a photo from an entry does not
delete the underlying stored file.

The footer groups **Buy me 2 porotta** and **Report a bug**. Both open popups.
The support popup offers food-themed amounts and a custom amount. Until verified
UPI details are set in frontend build variables (see frontend/.env.example), it
shows a labelled non-payment demo QR and disables checkout. It does not redirect
to CurrentUndo or its Cashfree page. No running-cost totals are fabricated.

Use **Report a bug** in the home-page footer to send an issue to the admin. Reports appear
in the separate **Bug reports** queue and can be marked resolved. This uses the same
contributions table and migration described below.

Players can use **Contribute a clue** in each game to submit a free-text suggestion.
Admin shows a pending contribution queue. Choose **Review and prepare entry**, verify
the suggestion, fill the catalog fields, then **Approve and add to game**. Approval
adds a validated entry and marks the suggestion approved in one transaction. Rejected
and pending suggestions never appear in game rounds. Submissions allow five per hour
per IP on each API process. For existing databases, run
`node --env-file=.env migrate-contributions.js` from `backend` before using this feature.

Each movie supports up to 30 dialogue pairs in Admin → Dialogues. Use **Add
dialogue** to enter another Malayalam line and its optional English version, then
**Save changes**. Players can switch languages for the selected dialogue; all
saved pairs are available as game clues. Existing single-dialogue entries remain
usable. For an existing database, run
`node --env-file=.env migrate-dialogue-variants.js` from `backend` before deploying
the updated API. This adds nullable columns and preserves existing dialogue
content. Restart the API after updating it.

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

## Missing Lyrics

Open `/#lyrics-game` for Solo, or choose Host or Buzzer in the mode selector.
Every song hides exactly ten unique Malayalam words, with at least one visible
word between blanks, including across line and stanza boundaries. Easy prefers
the beginning, Medium the middle, and Hard the ending, targeting six blanks in
the preferred third and two in each other third where spacing permits. Songs
without ten eligible, non-consecutive words are excluded. Repeated answers are
never left visible elsewhere.
Each correct word earns ten points. Malayalam Unicode and punctuation are
normalized; missing words require Malayalam spelling. Words are played in order.

Lyrics answer fields default to Manglish: type a word using English letters,
check the Malayalam preview, and choose another spelling when needed before
submitting. The Malayalam option accepts direct keyboard input or pasted text.
Only the selected Malayalam word is submitted for scoring. This is available in
Solo, Buzzer, and the older online team-play screen; host teams still answer aloud.

`POST /transliteration` converts a single typed word through the public
[Varnam service](https://github.com/varnamproject/varnamd-govarnam). It does not
consult the lyrics catalog or hidden answer. Suggestions are debounced in the
browser and cached with bounded storage on the backend. Conversion requires
internet access; if the service is unavailable, players can retry or use direct
Malayalam input. Deploy both frontend and backend for this feature.

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

## Host, Buzzer, and Solo

All five games offer the same three modes:

- Host (`/#host-game?game=lyrics`, or pictures/song/dialogue/clues): choose 2–8
  unique team names and start on one screen. Teams answer aloud. The host checks
  the answer and awards points to the first correct team, or reveals for zero.
  Players do not need devices or room invitations.
- Buzzer (`/#buzzer-game?game=lyrics`): the creator enters their name and creates
  a room as a competing player. Others join by code or link, each with their own
  score. The creator starts after at least two players join (up to twenty).
  Buzzing opens automatically. The first request wins a 5–120 second answer
  window; only that player can submit. The server checks answers and awards
  points. Wrong answers and timeouts lock out that player and reopen for others.
  Exhausting all attempts reveals the answer. Any player can advance a settled
  round. A majority can vote to skip while buzzers are open.
- Solo: existing individual song, picture, dialogue, and clue games; Missing
  Lyrics now also supports individual answers and scores without teams.

Host and Buzzer scores accumulate across rounds. The creator can switch games
once a round is complete, keeping participants, team names, and scores. Lyrics
rounds contain ten words; finish or skip them before switching games. Movie and
song answers earn 100 points. Five Clues awards 100/80/60/40/20 by clue number.
Lyrics awards 10 points per word. Song answers require the song title.

Refresh reconnects the same tab using sessionStorage. Leave game clears that
connection. Rooms live in server memory for six hours and reset on API restart;
run one API instance. Buzzer rooms poll every 400 ms; the server settles races.
The older `/buzzer` and `/lyrics-game` APIs remain for compatibility; the new
interface uses `/party-game`.

For phones on the same Wi-Fi, start Vite with `npm run dev -- --host 0.0.0.0`,
open the computer's LAN address before creating the room, and share that link.
Localhost links work only on the same computer. Frontend port 5173 and API port
4000 must be reachable. Set VITE_API_URL for a deployed API.

Checks: `node --test backend/partyEngine.test.js backend/partyGame.test.js
backend/lyricsPuzzle.test.js` from the project root, plus `npm run build` in
frontend. The API test uses an isolated local server and a stub catalog.

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
