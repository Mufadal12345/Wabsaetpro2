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
    const jsonSafeUser = JSON.parse(JSON.stringify(user, (_key, value) => {
      if (value && typeof value === 'object' && value.toDate) return value.toDate().toISOString();
      return value;
    }));
    localStorage.setItem("muf_user_cache", JSON.stringify(jsonSafeUser));
  };

  const handleFirebaseUser = async (fbUser: FirebaseUser) => {
    try {
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        if (userData.isBanned) {
          showToast("هذا الحساب محظور", "error");
          await firebaseSignOut(auth);
          setCurrentUser(null);
          return;
        }
        
        await updateDoc(userRef, { lastLogin: new Date().toISOString() });
        const updatedUser = { ...userData, id: fbUser.uid };
        setCurrentUser(updatedUser);
        cacheUser(updatedUser);
      } else {
        const newUser: Omit<User, "id"> = {
          name: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
          email: fbUser.email || "",
          specialty: "مستخدم",
          role: "user",
          isBanned: false,
          authMethod: fbUser.providerData[0]?.providerId || "email",
          emailVerified: fbUser.emailVerified,
          photoURL: fbUser.photoURL || "",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        await setDoc(userRef, newUser);
        const updatedUser = { ...newUser, id: fbUser.uid };
        setCurrentUser(updatedUser);
        cacheUser(updatedUser);
      }
    } catch (error) {
      console.error("Firestore Error:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // تم حذف getRedirectResult نهائياً لمنع خطأ missing initial state
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await handleFirebaseUser(user);
      } else {
        if (isMounted) {
          setCurrentUser(null);
          localStorage.removeItem("muf_user_cache");
        }
      }
      if (isMounted) setLoading(false);
    });

    const timeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 6000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      // استخدام Popup هو الحل الأكثر استقراراً داخل AppCreator24
      await signInWithPopup(auth, googleProvider);
      showToast("تم تسجيل الدخول بنجاح", "success");
    } catch (error: any) {
      setLoading(false);
      console.error("Google Login Error:", error);
      if (error.code === 'auth/popup-blocked') {
        showToast("يرجى السماح بالنوافذ المنبثقة", "error");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // تجاهل الخطأ إذا أغلق المستخدم النافذة
      } else {
        showToast("حدث خطأ أثناء الاتصال بجوجل", "error");
      }
    }
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
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem("muf_user_cache");
    await firebaseSignOut(auth);
    setCurrentUser(null);
  };

  const adminLogin = async () => {
    showToast("يرجى تسجيل الدخول بحساب المدير عبر جوجل", "info");
    return false;
  };

  const refreshUser = async () => {
    if (currentUser) {
      try {
        const userRef = doc(db, "users", currentUser.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const updatedUser = { ...(userSnap.data() as User), id: currentUser.id };
          setCurrentUser(updatedUser);
          cacheUser(updatedUser);
        }
      } catch (error) {
        console.error("Error refreshing user:", error);
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
      value={{
        currentUser,
        loading,
        adminLogin,
        logout,
        refreshUser,
        updateCurrentUserPhoto,
        updateCurrentUser,
        login,
        signup,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

