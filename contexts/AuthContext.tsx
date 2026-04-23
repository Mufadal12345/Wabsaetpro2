import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, getCountFromServer } from "firebase/firestore";
import { User } from "../types";
import { useToast } from "./ToastContext";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  adminLogin: (name: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("muf_user_cache");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Helper to fetch/create user from Firestore based on Firebase Auth
  const handleFirebaseUser = async (fbUser: FirebaseUser) => {
    console.log("Handling Firebase User:", fbUser.uid, fbUser.email);
    try {
      const userRef = doc(db, "users", fbUser.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
        console.log("User snapshot exists:", userSnap.exists());
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "users");
        return;
      }

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        console.log("User data:", userData);
        if (userData.isBanned) {
          console.warn("User is banned");
          showToast("هذا الحساب محظور", "error");
          await firebaseSignOut(auth);
          setCurrentUser(null);
          return;
        }
        
        // ... (rest of the logic remains the same)
        const updates: Partial<User> = { lastLogin: new Date().toISOString() };
        
        try {
          await updateDoc(userRef, updates);
          console.log("User updated successfully");
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${fbUser.uid}`);
        }
        const updatedUser = { ...userData, id: fbUser.uid };
        setCurrentUser(updatedUser);
        localStorage.setItem("muf_user_cache", JSON.stringify(updatedUser));
        console.log("User set in state:", updatedUser);
      } else {
        console.log("Creating new user...");
        // New User
        let name = fbUser.displayName || fbUser.email?.split("@")[0] || "User";
        
        let role: User["role"] = "user";
        let specialty = "مستخدم";
        
        try {
          // Attempt to get count, but catch error and default to non-admin if failed
          const countSnapshot = await getCountFromServer(collection(db, "users"));
          if (countSnapshot.data().count < 3) {
            role = "super_admin";
            specialty = "المدير الرئيسي";
          }
        } catch (e) {
          console.warn("Could not get users count (expected if not admin), defaulting to user role");
          // Do not treat as a critical failure for auth
        }

        const newUser: Omit<User, "id"> = {
          name,
          email: fbUser.email || "",
          specialty,
          role,
          isBanned: false,
          authMethod: fbUser.providerData[0]?.providerId || "email",
          emailVerified: fbUser.emailVerified,
          photoURL: fbUser.photoURL || "",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        try {
          await setDoc(userRef, newUser);
          console.log("New user created successfully");
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${fbUser.uid}`);
        }
        const updatedUser = { ...newUser, id: fbUser.uid };
        setCurrentUser(updatedUser);
        localStorage.setItem("muf_user_cache", JSON.stringify(updatedUser));
        console.log("New user set in state:", updatedUser);
      }
    } catch (error) {
      console.error("Auth Error", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await handleFirebaseUser(user);
      } else {
        setCurrentUser(null);
        localStorage.removeItem("muf_user_cache");
      }
      setLoading(false);
    });

    // Safety timeout: if auth doesn't respond in 5 seconds, stop loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const adminLogin = async () => {
    // Legacy custom admin login is disabled because it bypasses Firebase Auth
    // and causes Firestore permission errors. Please use Google Login with an admin email instead.
    showToast("يرجى تسجيل الدخول باستخدام حساب جوجل الخاص بالمدير", "info");
    return false;
  };

  const logout = async () => {
    localStorage.removeItem("muf_user_cache");
    await firebaseSignOut(auth);
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    if (currentUser && currentUser.authMethod !== "admin") {
      // Re-fetch logic if needed
    }
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, loading, adminLogin, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
