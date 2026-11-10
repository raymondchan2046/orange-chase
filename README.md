# Orange Chase

A fanged orange twice your size wants a bite. You are the stickman. Stay out of its mouth for 60 seconds and you win.

Orange Chase is a small web game that installs like an app: it has a home-screen icon, opens full screen, and keeps working with no connection.

## How to play

| | Keyboard | Touch |
|---|---|---|
| Run | Arrow keys or WASD | Drag anywhere in the park |
| Dash | Space or Shift | Dash button, or tap with a second finger |
| Pause | P or Esc | Pause button |

- Stars score points. Bolts speed you up, ice freezes the orange, and a bubble blocks one bite.
- Close calls and dodged lunges pay a bonus. Tricking a lunging orange into a tree or the fence stuns it and pays the most.
- Harder parks multiply every point. Your best score for each park is saved on the device.

## The four parks

| Park | Difficulty | What changes |
|---|---|---|
| Sunny Meadow | Easy | Slow orange, open lawn, ponds that slow you down |
| Autumn Grove | Medium | The orange winds up and lunges; sticky mud |
| Frozen Commons | Hard | Faster orange, frozen ponds where you both slide |
| Midnight Park | Extreme | Dark except for lamp glow, and a second orange joins at 30 seconds |

## Install it on a phone

Open the game's web address on the phone, then:

- **Android (Chrome):** tap **Install app** on the game's menu, or use the browser menu and choose *Add to Home screen*.
- **iPhone or iPad (Safari):** tap **Share**, then **Add to Home Screen**.

After that it launches from its own icon and works offline.

## Run it on your computer

No build step and no dependencies. Serve the folder with any static web server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Opening `index.html` straight from disk also plays, but installing and offline mode need a web server.

## What is in here

| File | What it does |
|---|---|
| `index.html`, `style.css` | The page, menus and scoreboard |
| `game.js` | Rules: movement, the orange's chasing and lunging, pickups, scoring |
| `scenes.js` | The four parks: difficulty settings, colours, music, layout |
| `draw-world.js`, `draw-actors.js`, `render.js` | Everything drawn on the canvas |
| `audio.js` | Music and sound effects, synthesised in the browser (no audio files) |
| `ui.js` | Controls, menus, saved best scores, main loop |
| `app.js`, `sw.js`, `manifest.webmanifest`, `icons/` | The app shell: install button, offline cache, icons |
| `fonts/` | Titan One and Nunito, bundled under the SIL Open Font License (license files included) |
