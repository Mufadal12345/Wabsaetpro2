import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  QueryConstraint,
  DocumentData,
  WithFieldValue,
  PartialWithFieldValue
} from 'firebase/firestore';
import { db, auth } from '../../../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  QUERY = 'query',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const getSafeError = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err !== null && 'message' in err) return String((err as any).message);
    return String(err);
  };

  const errInfo: FirestoreErrorInfo = {
    error: getSafeError(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  const safeStringify = (obj: any) => {
    const cache = new Set();
    return JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return '[Circular]';
        cache.add(value);
      }
      return value;
    });
  };

  const jsonError = safeStringify(errInfo);
  console.error('Firestore Error: ', jsonError);
  throw new Error(jsonError);
}

export const FirestoreService = {
  async getDocument<T = DocumentData>(collectionPath: string, docId: string): Promise<T | null> {
    const path = `${collectionPath}/${docId}`;
    try {
      const docRef = doc(db, collectionPath, docId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as T;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async queryDocuments<T = DocumentData>(collectionPath: string, ...queryConstraints: QueryConstraint[]): Promise<T[]> {
    try {
      const colRef = collection(db, collectionPath);
      const q = query(colRef, ...queryConstraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }) as T);
    } catch (error) {
      handleFirestoreError(error, OperationType.QUERY, collectionPath);
    }
  },

  async addDocument<T extends WithFieldValue<DocumentData>>(collectionPath: string, data: T): Promise<string> {
    try {
      const colRef = collection(db, collectionPath);
      const docRef = await addDoc(colRef, data);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collectionPath);
    }
  },

  async setDocument<T extends WithFieldValue<DocumentData>>(collectionPath: string, docId: string, data: T): Promise<void> {
    const path = `${collectionPath}/${docId}`;
    try {
      const docRef = doc(db, collectionPath, docId);
      await setDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateDocument<T extends PartialWithFieldValue<DocumentData>>(collectionPath: string, docId: string, data: T): Promise<void> {
    const path = `${collectionPath}/${docId}`;
    try {
      const docRef = doc(db, collectionPath, docId);
      await updateDoc(docRef, data as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteDocument(collectionPath: string, docId: string): Promise<void> {
    const path = `${collectionPath}/${docId}`;
    try {
      const docRef = doc(db, collectionPath, docId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
