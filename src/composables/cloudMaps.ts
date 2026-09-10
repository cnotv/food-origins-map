import { getFirestoreDb } from '../lib/firebase'
import type { SavedMap } from './savedMaps'

// Cloud saved maps live at users/{uid}/savedMaps/{mapId}, scoped per signed-in
// user. Pair with Firestore rules that restrict each subtree to its owner:
//   match /users/{uid}/savedMaps/{mapId} {
//     allow read, write: if request.auth != null && request.auth.uid == uid;
//   }
const SUBCOLLECTION = 'savedMaps'

export async function listCloudMaps(uid: string): Promise<SavedMap[]> {
  const { collection, getDocs, orderBy, query } = await import('firebase/firestore')
  const db = await getFirestoreDb()
  const snap = await getDocs(
    query(collection(db, 'users', uid, SUBCOLLECTION), orderBy('createdAt', 'desc')),
  )
  return snap.docs.map((d) => {
    const data = d.data() as Omit<SavedMap, 'id'>
    return { id: d.id, name: data.name, query: data.query, createdAt: data.createdAt }
  })
}

export async function addCloudMap(uid: string, name: string, mapQuery: string): Promise<SavedMap> {
  const { collection, addDoc } = await import('firebase/firestore')
  const db = await getFirestoreDb()
  const createdAt = Date.now()
  const ref = await addDoc(collection(db, 'users', uid, SUBCOLLECTION), {
    name,
    query: mapQuery,
    createdAt,
  })
  return { id: ref.id, name, query: mapQuery, createdAt }
}

export async function removeCloudMap(uid: string, id: string): Promise<void> {
  const { doc, deleteDoc } = await import('firebase/firestore')
  const db = await getFirestoreDb()
  await deleteDoc(doc(db, 'users', uid, SUBCOLLECTION, id))
}
