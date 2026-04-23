import React, { useState } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { Icons } from "../components/Icons";
import { Logo } from "../components/Logo";

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "هذا البريد مسجل لدينا بالفعل، يمكنك تسجيل الدخول.",
  "auth/weak-password": "كلمة المرور ضعيفة جداً، يرجى اختيار كلمة مرور أقوى.",
  "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة، تأكد من كتابتها بشكل صحيح.",
  "auth/wrong-password": "كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.",
  "auth/invalid-credential": "بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.",
  "auth/user-not-found": "لم نتمكن من العثور على حساب بهذا البريد، يمكنك إنشاء حساب جديد.",
  "auth/too-many-requests": "لقد تجاوزت الحد المسموح به من المحاولات الخاطئة. يرجى المحاولة لاحقاً.",
  "auth/network-request-failed": "يبدو أن هناك مشكلة في الاتصال بالإنترنت، يرجى التحقق ثم المحاولة."
};

const getFriendlyErrorMessage = (error: any) => {
  return FIREBASE_ERRORS[error.code] || "حدث خطأ أثناء العملية، يرجى المحاولة لاحقاً.";
};

export const Login: React.FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Removed unused redirect result hook
  React.useEffect(() => {
    // Popup flow doesn't need redirect unmounting
  }, []);
  
  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error("Google Auth Error:", e);
      setError(getFriendlyErrorMessage(e));
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    setError("");
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (password.length < 6)
          throw new Error("auth/weak-password");
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await sendEmailVerification(userCred.user);
      }
    } catch (e: any) {
      if (e.message === "auth/weak-password") {
        setError(FIREBASE_ERRORS["auth/weak-password"]);
      } else {
        setError(getFriendlyErrorMessage(e));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex bg-[#0a0f1f] overflow-hidden">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-slate-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 text-center px-12 animate-fade-in">
          <div className="mb-8 flex justify-center">
            <div className="glass-card rounded-3xl p-8 border-t-4 border-pink-500 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-500/10 to-transparent pointer-events-none"></div>
              <Logo size={180} />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white font-amiri mb-6 drop-shadow-lg">متحف الفكر</h1>
          <p className="text-xl text-gray-300 max-w-lg mx-auto leading-relaxed">
            بوابة الإبداع الفكرية الرقمية. مساحتك الآمنة لاستكشاف الأفكار، تبادل المعرفة، وتطوير مهاراتك.
          </p>
          <div className="mt-12 pt-8 border-t border-white/10 inline-block">
            <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">متحف الفكر</p>
            <p className="text-pink-400 font-bold text-xl font-tajawal">بوابة الإبداع الرقمية</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-y-auto">
        {/* Mobile Branding */}
        <div className="lg:hidden text-center mb-10 animate-fade-in mt-8">
          <div className="mb-6 flex justify-center">
            <div className="glass-card rounded-2xl p-4 border-t-2 border-pink-500 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-500/10 to-transparent pointer-events-none"></div>
              <Logo size={100} />
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text font-amiri mb-2">متحف الفكر</h1>
          <p className="text-gray-400 text-sm">بوابة الإبداع الفكرية الرقمية</p>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">متحف الفكر</p>
            <p className="text-pink-400 font-bold text-sm font-tajawal">بوابة الإبداع الرقمية</p>
          </div>
        </div>

        <div className="w-full max-w-md space-y-8 animate-slide-in">
          <div className="text-center lg:text-right">
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === "login" ? "مرحباً بعودتك 👋" : "إنشاء حساب جديد ✨"}
            </h2>
            <p className="text-gray-400">
              {mode === "login" ? "سجل دخولك للمتابعة في متحف الفكر" : "انضم إلى مجتمعنا الراقي وشارك أفكارك"}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-start gap-3 animate-shake">
              <Icons.Warning className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Removed mandatory registration message */}

          <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(); }} className="space-y-5">
            {mode === "register" && (
              <div className="space-y-5 animate-fade-in">
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                    <Icons.User className="w-5 h-5" />
                  </div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    placeholder="اسم المستخدم"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                    <Icons.Briefcase className="w-5 h-5" />
                  </div>
                  <input
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    type="text"
                    placeholder="التخصص (اختياري)"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                <Icons.Mail className="w-5 h-5" />
              </div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="البريد الإلكتروني"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                <Icons.Lock className="w-5 h-5" />
              </div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="كلمة المرور"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === "login" ? (
                "تسجيل الدخول"
              ) : (
                "إنشاء حساب"
              )}
            </button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">أو المتابعة باستخدام</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571c.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            <span>جوجل (Google)</span>
          </button>

          <p className="text-center text-gray-400 mt-8">
            {mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-pink-400 hover:text-pink-300 font-bold transition-colors"
            >
              {mode === "login" ? "إنشاء حساب جديد" : "تسجيل الدخول"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
