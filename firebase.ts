import * as firebaseApp from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

const app = firebaseApp.initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with faster connection settings
export const db = initializeFirestore(app, {});

export const googleProvider = new GoogleAuthProvider();

console.log("Firebase initialized successfully with optimized cache");

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
    errorString = JSON.stringify(errInfo);
  } catch (e) {
    errorString = JSON.stringify({
      error: errInfo.error,
      operationType: errInfo.operationType,
      path: errInfo.path,
    });
  }

  console.error("Firestore Error: ", errorString);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("firestore-error", { detail: { message: errInfo.error } }));
  }
  // Now we just log the error and dispatch, preventing the ErrorBoundary from crashing the app.
}
