# Recomp

A workout and calorie tracker with accounts, friends, points, and a leaderboard.
Zero dependencies. It needs Node 22.13 or newer (it uses the built-in `node:sqlite`).

## Run it on your computer

    node server.js

Open http://localhost:3000, create an account, and you're in. Data is saved in `data/recomp.db`.

## Put it on the internet

Your host must give the app a **persistent disk**, because accounts and data live in one SQLite file.
Without a disk, every redeploy deletes everyone's data.

Easiest route (Docker-based hosts such as Fly.io, Railway, or Render):

1. Upload these files to a GitHub repo.
2. Create a new web service from the repo. It will use the `Dockerfile`.
3. Attach a persistent volume mounted at `/data`. The Dockerfile already sets `DB_PATH=/data/recomp.db`.
4. Deploy. The host gives you an https URL to share with friends.

Without Docker: set the start command to `node server.js` and make sure the host uses Node 22.13+.
Set `DB_PATH` to a path on the persistent disk.

## Settings (environment variables)

- `PORT`: port to listen on (hosts usually set this for you). Default 3000.
- `DB_PATH`: where the database file lives. Default `data/recomp.db`.
- `COOKIE_SECURE=1`: send login cookies over https only. Already on in the Dockerfile.

## How it works

- Accounts: usernames (3-20 letters, numbers, underscores) and passwords (8+ characters). Passwords are
  hashed with scrypt, never stored in plain text. Logins last 30 days.
- Data: each person's days, weight, plan, and photos are saved to their account.
- Friends: add by username. The other person accepts. The leaderboard has a Friends view and an Everyone view.
- Points: 10 for each day within the calorie and protein goals, 20 per finished workout.
  Scores are reported by each person's browser, so they work on the honor system.

## Before you share it widely

- Back up `recomp.db` regularly (copy the file).
- Anyone can create an account, and usernames show on the Everyone leaderboard. Pick usernames that don't reveal real names.
- Photos are private to their owner, but they are stored unencrypted in the database.
- This is built for a group of friends. Before opening it to the public, add a privacy policy and password reset by email.
