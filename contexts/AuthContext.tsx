import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db, googleProvider } from "../firebase";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  getRedirectResult,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { User } from "../types";
import { useToast } from "./ToastContext";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  adminLogin: (name: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateCurrentUserPhoto: (photoURL: string) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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

  const cacheUser = (user: User) => {
    // Ensure data is plain JSON serializable, converting potential Timestamps
    const jsonSafeUser = JSON.parse(JSON.stringify(user, (_key, value) => {
      if (value && typeof value === 'object' && value.toDate) return value.toDate().toISOString();
      return value;
    }));
    localStorage.setItem("muf_user_cache", JSON.stringify(jsonSafeUser));
  };

  // Helper to fetch/create user from Firestore based on Firebase Auth
  const handleFirebaseUser = async (fbUser: FirebaseUser) => {
    console.log("Handling Firebase User:", fbUser.uid, fbUser.email);
    try {
      const userRef = doc(db, "users", fbUser.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
        console.log("User snapshot exists:", userSnap?.exists());
      } catch (error) {
        console.error("Error fetching user doc, will assume new or use cache:", error);
      }

      if (userSnap && userSnap.exists()) {
        const userData = userSnap.data() as User;
        console.log("User data:", userData);
        if (userData.isBanned) {
          console.warn("User is banned");
          showToast("هذا الحساب محظور", "error");
          await firebaseSignOut(auth);
          setCurrentUser(null);
          return;
        }
        
        const updates: Partial<User> = { lastLogin: new Date().toISOString() };
        
        try {
          await updateDoc(userRef, updates);
        } catch (error) {
          console.error("User update failed:", error);
        }
        const updatedUser = { ...userData, id: fbUser.uid };
        setCurrentUser(updatedUser);
        cacheUser(updatedUser);
      } else {
        console.log("Creating new user...");
        let name = fbUser.displayName || fbUser.email?.split("@")[0] || "User";
        let role: User["role"] = "user"; // Firestore rules mandate role == 'user' on creation
        let specialty = "مستخدم";

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
        } catch (error) {
          console.error("Error creating user doc:", error);
          // Don't force logout immediately, let the user stay in state if possible to avoid loops
        }
        const updatedUser = { ...newUser, id: fbUser.uid };
        setCurrentUser(updatedUser);
        cacheUser(updatedUser);
      }
    } catch (error) {
      console.error("Auth Error", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Check redirect result on mount
    getRedirectResult(auth).then(async (result) => {
        if (result?.user) {
            console.log("Redirect login successful");
            // The user will also be handled by onAuthStateChanged
            // showToast("تم الدخول بنجاح", "success");
        }
    }).catch((error) => {
        console.error("Error with redirect result", error);
        if (isMounted && error.code !== 'auth/redirect-cancelled-by-user') {
             showToast("حدث خطأ أثناء تسجيل الدخول عبر جوجل", "error");
        }
        if (isMounted) setLoading(false);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await handleFirebaseUser(user);
      } else {
        if (isMounted) {
          setCurrentUser(null);
          localStorage.removeItem("muf_user_cache");
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    });

    // Safety timeout: if auth doesn't respond in 5 seconds, stop loading
    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
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

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      throw error;
    }
  };

  const signup = async (email: string, pass: string, name: string) => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCred.user, { displayName: name });
      // The onAuthStateChanged will handle firestore doc creation
    } catch (error: any) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (currentUser && currentUser.authMethod !== "admin") {
      try {
        const userRef = doc(db, "users", currentUser.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const updatedUser = { ...(userSnap.data() as User), id: currentUser.id };
          setCurrentUser(updatedUser);
          cacheUser(updatedUser);
        }
      } catch (error) {
         console.error("error refreshing user", error);
      }
    }
  };

  const updateCurrentUserPhoto = (photoURL: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, photoURL };
      setCurrentUser(updatedUser);
      cacheUser(updatedUser);
    }
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      cacheUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, loading, adminLogin, logout, refreshUser, updateCurrentUserPhoto, updateCurrentUser, login, signup, loginWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
};

