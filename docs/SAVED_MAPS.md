# Saved maps

The **Maps** panel (topbar button, next to Search/Forage) lets a visitor save
the current view — active category filter, selected food, and detail tab —
under a name, and reload it later. A "saved map" is just that name plus the
same query string the app already uses for shareable URLs
(`?view=&filter=&item=&tab=`, built by `buildQueryString()` in
[App.vue](../src/App.vue)); loading one re-applies it exactly like following
a bookmarked link.

There's no backend, so saved maps live in one of two places:

- **localStorage (default, no setup).** Saves are written to
  `localStorage['food-origins-map:saved-maps']` in the visitor's browser —
  see [src/composables/savedMaps.ts](../src/composables/savedMaps.ts). Private
  to that browser; cleared if site data is cleared.
- **Firestore, behind Google sign-in (optional).** If Firebase is configured
  (see below), the panel offers "Sign in with Google" and, once signed in,
  reads/writes `users/{uid}/savedMaps/*` in Firestore instead — see
  [src/composables/cloudMaps.ts](../src/composables/cloudMaps.ts) and
  [src/composables/useGoogleAuth.ts](../src/composables/useGoogleAuth.ts). This
  syncs a visitor's saved maps across devices/browsers.

The two stores are independent: signed out, `MapsView.vue` reads/writes
localStorage; signed in, it reads/writes Firestore. There is no merge.

## Enabling Google sign-in + cloud sync

1. Create a project at the [Firebase console](https://console.firebase.google.com).
2. **Authentication → Sign-in method → Google → Enable.**
3. **Firestore Database → Create database** (production mode).
4. Set these Firestore rules so each visitor can only read/write their own
   saved maps:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/savedMaps/{mapId} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

5. **Project settings → General → Your apps → Add app → Web**, then copy the
   resulting config into environment variables (see
   [.env.example](../.env.example)):

   ```
   VITE_FIREBASE_API_KEY=…
   VITE_FIREBASE_AUTH_DOMAIN=…
   VITE_FIREBASE_PROJECT_ID=…
   VITE_FIREBASE_APP_ID=…
   VITE_FIREBASE_STORAGE_BUCKET=…          # optional
   VITE_FIREBASE_MESSAGING_SENDER_ID=…     # optional
   ```

   On Netlify: **Site configuration → Environment variables**, add the same
   keys, then redeploy.
6. **Authentication → Settings → Authorized domains** — add the deployed
   domain (e.g. `food-origins.netlify.app`) so the Google sign-in popup is
   allowed to complete there.

Firebase is loaded via dynamic `import()` only once a visitor opens the Maps
panel or attempts to sign in, so a deployment that leaves these variables
unset ships no extra JavaScript for this feature and simply shows
localStorage-only saved maps with no sign-in option.
