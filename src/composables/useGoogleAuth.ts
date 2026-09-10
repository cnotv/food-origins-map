import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase'

export interface AuthUser {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

export function useGoogleAuth() {
  const user = ref<AuthUser | null>(null)
  const busy = ref(false)
  const error = ref('')
  let unsubscribe: (() => void) | null = null

  onMounted(async () => {
    if (!isFirebaseConfigured) return
    const [{ onAuthStateChanged }, auth] = await Promise.all([
      import('firebase/auth'),
      getFirebaseAuth(),
    ])
    unsubscribe = onAuthStateChanged(auth, (u) => {
      user.value = u ? { uid: u.uid, displayName: u.displayName, email: u.email, photoURL: u.photoURL } : null
    })
  })
  onBeforeUnmount(() => unsubscribe?.())

  async function signIn() {
    if (!isFirebaseConfigured) {
      error.value = 'Cloud sync is not configured for this deployment.'
      return
    }
    busy.value = true
    error.value = ''
    try {
      const [{ GoogleAuthProvider, signInWithPopup }, auth] = await Promise.all([
        import('firebase/auth'),
        getFirebaseAuth(),
      ])
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch {
      error.value = 'Sign-in failed. Please try again.'
    } finally {
      busy.value = false
    }
  }

  async function signOut() {
    if (!isFirebaseConfigured) return
    const [{ signOut: firebaseSignOut }, auth] = await Promise.all([
      import('firebase/auth'),
      getFirebaseAuth(),
    ])
    await firebaseSignOut(auth)
  }

  return { user, busy, error, signIn, signOut }
}
