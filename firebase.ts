import * as firebaseApp from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfigJSON from "./firebase-applet-config.json";

const app = firebaseApp.initializeApp(firebaseConfigJSON);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => console.error("Error setting persistence", error));

export const storage = getStorage(app);

// Initialize Firestore with local persistence for ultra-fast loading
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfigJSON.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();

console.log("Firebase initialized successfully with WEB Frontend config.");

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

function safeJsonStringify(obj: any): string {
  const cache = new Set();
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === "object" && value !== null) {
      if (cache.has(value)) {
        return "[Circular]";
      }
      cache.add(value);
    }
    return value;
  });
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };

  let errorString: string;
  try {
    errorString = safeJsonStringify(errInfo);
  } catch (e) {
    errorString = "Error stringifying firestore error information.";
  }

  console.error("Firestore Error: ", errorString);
  throw new Error(errorString);
}
