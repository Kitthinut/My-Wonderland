# My Wonderland: setup guide

How the pieces connect:

```
Phone / tablet / iPad  ──(installed PWA)──>  GitHub Pages (hosts index.html)
        │
        ├── Firebase Auth (Google sign-in) ── gives you a user id + a Google token
        │        ├── Firestore  : users/{uid}  = all your habits, food, money, journals, tasks, layout
        │        └── Google token ──> Google Calendar API (read + add events)
        └── YouTube / YouTube Music : plain links, no setup needed
```
One Google sign-in powers both sync and the calendar. Nothing else needs a server.

## 1. GitHub Pages (hosting)
1. Create a repo (e.g. `My-Wonderland`) and upload everything in this folder (`index.html`, `manifest.json`, `sw.js`, `icon.svg`, `assets/`).
2. Settings → Pages → Deploy from branch → `main` / root. Your URL will be `https://YOURNAME.github.io/My-Wonderland/`.

## 2. Firebase project (sync + login)
1. https://console.firebase.google.com → Add project.
2. Project settings → Your apps → Web (`</>`) → register → copy the `firebaseConfig`.
3. Open `index.html`, find `const FB={...}` near the top of the script, and paste `apiKey`, `authDomain`, `projectId`, `appId` into it. Commit.
4. Build → Authentication → Get started → Sign-in method → enable **Google**.
5. Authentication → Settings → **Authorized domains** → add `YOURNAME.github.io`.
6. Build → Firestore Database → Create database (production mode). Rules tab, paste and publish:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 3. Google Calendar (same Google Cloud project)
1. https://console.cloud.google.com → pick the project Firebase created (same name).
2. APIs & Services → Library → **Google Calendar API** → Enable.
3. APIs & Services → OAuth consent screen → External → fill app name + your email.
4. Data access / Scopes → add `https://www.googleapis.com/auth/calendar.events`.
5. Audience / Test users → add your own Google email (keep the app in Testing mode; it is only for you).
6. Back in the app: open the Calendar, tap **Sign in with Google**, accept the calendar permission.

## 4. Install on your devices
- iPhone / iPad: open the URL in Safari → Share → Add to Home Screen.
- Android: Chrome menu → Install app (or the 📲 Install button in the app).
- Sign in with the **same Google account** on each device; data syncs through Firestore.

## 5. How data flows
| Furniture | Stored in | Notes |
|---|---|---|
| Everything except Calendar | Firestore `users/{uid}` + local cache | Works offline, syncs when online |
| Calendar | Your Google Calendar | Read/add via the Google token |
| TV / Radio | YouTube / YouTube Music links | Only your saved titles/playlists are stored |
| Room layout, level/XP | Firestore `users/{uid}` | Arrange mode saves positions |

## 6. Troubleshooting
- **Popup blocked / sign-in fails on iPhone home-screen app:** sign in once in Safari, then reopen the app.
- **"auth/unauthorized-domain":** add your GitHub Pages domain in step 2.5.
- **Calendar asks to sign in again:** Google tokens last about an hour; tap Sign in again. Sync is unaffected.
- **"Access blocked":** add your email as a test user (step 3.5).
- **Photos:** meal photos are saved as small thumbnails; Firestore's 1 MB per-document limit means a few hundred photos is the ceiling.
- **First sign-in on a new device with local data:** the cloud copy wins, so sign in before adding data on the new device.