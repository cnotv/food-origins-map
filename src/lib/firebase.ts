// Firebase is entirely optional: the app works with localStorage-only saved
// maps when no config is present, and only pulls in the Firebase SDK (via
// dynamic import) once a signed-in flow actually needs it.
export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  storageBucket?: string
  messagingSenderId?: string
}

function readConfig(): FirebaseWebConfig | null {
  const env = import.meta.env
  const apiKey = env.VITE_FIREBASE_API_KEY
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN
  const projectId = env.VITE_FIREBASE_PROJECT_ID
  const appId = env.VITE_FIREBASE_APP_ID
  if (!apiKey || !authDomain || !projectId || !appId) return null
  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  }
}

export const firebaseConfig = readConfig()
export const isFirebaseConfigured = firebaseConfig !== null

let appPromise: Promise<import('firebase/app').FirebaseApp> | null = null

async function getFirebaseApp() {
  if (!firebaseConfig) throw new Error('Firebase is not configured')
  if (!appPromise) {
    appPromise = import('firebase/app').then(({ initializeApp, getApps, getApp }) =>
      getApps().length ? getApp() : initializeApp(firebaseConfig!),
    )
  }
  return appPromise
}

export async function getFirebaseAuth() {
  const [{ getAuth }, app] = await Promise.all([import('firebase/auth'), getFirebaseApp()])
  return getAuth(app)
}

export async function getFirestoreDb() {
  const [{ getFirestore }, app] = await Promise.all([
    import('firebase/firestore'),
    getFirebaseApp(),
  ])
  return getFirestore(app)
}
