# My Wonderland: setup guide

How the pieces connect:

```
Phone / tablet / iPad  ──(installed PWA)──>  GitHub Pages (hosts index.html)
        │
        ├── Firebase Auth (Email/Password) ── gives you a user id
        │        └── Firestore : users/{uid} = habits, food, money, journals, tasks, layout
        ├── Google Calendar : opens calendar.google.com in a new tab (no API or OAuth)
        └── YouTube / YouTube Music : plain links, no setup needed
```

Sign in with an email and password to sync your data across devices. No Google sign-in or Google Cloud setup is needed — the Calendar section simply opens Google Calendar.

## 1. GitHub Pages (hosting)
1. Create a repo (e.g. `My-Wonderland`) and upload everything in this folder (`index.html`, `manifest.json`, `sw.js`, `icon.svg`, `assets/`).
2. Settings → Pages → Build and deployment: choose **GitHub Actions** if you use the config-injection workflow below, or "Deploy from branch" → `main` / root. Your URL will be `https://YOURNAME.github.io/My-Wonderland/`.

## 2. Firebase project (sync + login)
1. https://console.firebase.google.com → Add project.
2. Project settings → Your apps → Web (`</>`) → register → copy the `firebaseConfig`.
3. Put your Firebase web app values in `firebase-config.js` as a plain `const firebaseConfig = { ... }` object. Do not include SDK imports or call `initializeApp()` in that file; the app loads the Firebase SDK and initializes it. `firebase-config.js` is ignored by Git (the GitHub Actions workflow below generates it at build time). Firebase web API keys are client identifiers, not secrets; restrict them where possible and rely on Firebase security rules to protect data.
4. Build → Authentication → Get started → **Sign-in method** → enable **Email/Password**.
5. Authentication → Settings → **Authorized domains** → add `YOURNAME.github.io` (and `localhost` for local testing).
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

**Using GitHub variables/secrets:** static files served by Pages cannot read Actions variables at runtime. The workflow in `.github/workflows/deploy.yml` writes them into `firebase-config.js` at build time (either `window.FIREBASE_CONFIG` or a plain `const firebaseConfig` works). Set these four values in **Settings → Secrets and variables → Actions** (Variables or Secrets; repository-wide or in the `github-pages` environment):

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_APP_ID`

(Short names `API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `APP_ID` also work.) Choose **GitHub Actions** as the Pages source (step 1), otherwise the workflow will not publish anything. If you stored the values in a differently named environment, change `environment.name` in the workflow's `build` job to match. Check the Actions run log — a warning there means a name or scope didn't match.

## 3. Google Calendar
No API, OAuth client, or test-user setup is required. In the app:
- **📅 Open Google Calendar** opens your calendar in a new tab.
- Enter a plan, pick a time, and press **Add to Google Calendar** to open Google's pre-filled event editor in a new tab; save it there.

Stay signed in to Google in your browser so the calendar opens on the right account. Plans are stored in Google Calendar, not in the app.

## 4. Install on your devices
- iPhone / iPad: open the URL in Safari → Share → Add to Home Screen.
- Android: Chrome menu → Install app (or the 📲 Install button in the app).
- Sign in with the **same email and password** on each device; data syncs through Firestore.

## 5. How data flows
| Furniture | Stored in | Notes |
|---|---|---|
| Everything except Calendar | Firestore `users/{uid}` + local cache | Works offline, syncs when online |
| Calendar | Your Google Calendar | Plain links — no token or API in the app |
| TV / Radio | YouTube / YouTube Music links | Only your saved titles/playlists are stored |
| Room layout, level/XP | Firestore `users/{uid}` | Arrange mode saves positions |

## 6. Troubleshooting
- **"auth/unauthorized-domain":** add the exact hostname from the address bar (e.g. `kitthinut.github.io`, `localhost`, or `127.0.0.1`) to Firebase → Authentication → Settings → Authorized domains.
- **"Password is too weak / account not found":** passwords must be at least 6 characters. Create the account once with **Create account** in Settings.
- **Forgot password:** Firebase Console → Authentication → Users → select the user → Reset password.
- **Google Calendar event editor:** it opens in a new tab and needs you signed in to Google in that browser.
- **Photos:** meal photos are saved as small thumbnails; Firestore's 1 MB per-document limit means a few hundred photos is the ceiling.
- **First sign-in on a new device with local data:** the cloud copy wins, so sign in before adding data on the new device.
