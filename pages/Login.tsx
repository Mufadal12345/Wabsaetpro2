import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../src/features/auth/hooks/useAuth";
import { useToast } from "../contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, Key, Mail, Sparkles, Quote as QuoteIcon } from "lucide-react";

const quotes = [
  { text: "العقل ليس وعاءً يجب ملؤه، ولكنه نار يجب إيقادها.", author: "بلوتارخ" },
  { text: "الدهشة هي بداية الحكمة.", author: "أرسطو" },
  { text: "أنا أفكر، إذن أنا موجود.", author: "رينيه ديكارت" },
  { text: "المعرفة الحقيقية هي أن تعرف مدى جهلك.", author: "سقراط" },
];

const FIREBASE_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "هذا البريد مسجل لدينا بالفعل، يمكنك تسجيل الدخول.",
  "auth/weak-password": "كلمة المرور ضعيفة جداً، يرجى اختيار كلمة مرور أقوى.",
  "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة، تأكد من كتابتها بشكل صحيح.",
  "auth/wrong-password": "كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.",
  "auth/invalid-credential": "بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.",
  "auth/user-not-found": "لم نتمكن من العثور على حساب بهذا البريد، يمكنك إنشاء حساب جديد.",
  "auth/too-many-requests": "لقد تجاوزت الحد المسموح به من المحاولات الخاطئة. يرجى المحاولة لاحقاً.",
  "auth/network-request-failed": "يبدو أن هناك مشكلة في الاتصال بالإنترنت، يرجى التحقق ثم المحاولة.",
  "auth/unauthorized-domain": "هذا النطاق غير مصرح له بتسجيل الدخول. يجب إضافته في إعدادات Firebase Authentication.",
  "auth/operation-not-allowed": "تسجيل الدخول عبر جوجل غير مفعل حالياً في منصة Firebase.",
};

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);

  const { login, signup, signInWithGoogle: loginWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isFormLoading = loading || authLoading;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        showToast("مرحباً بك مجدداً في متحف الفكر", "success");
      } else {
        await signup(email, password, name);
        showToast("تم إنشاء حسابك بنجاح. أهلاً بك!", "success");
      }
      navigate("/");
    } catch (error: any) {
      const msg = FIREBASE_ERRORS[error.code] || "حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      showToast("تم الدخول بنجاح عبر جوجل", "success");
      navigate("/");
    } catch (error: any) {
        if (error.code === "auth/popup-closed-by-user" || error.message === 'تم إلغاء عملية تسجيل الدخول') {
            showToast("تم إغلاق نافذة تسجيل الدخول", "info");
        } else {
            showToast("فشل الدخول عبر جوجل", "error");
        }
    }
  };

  return (
    <div className="min-h-screen flex bg-[#050505] font-tajawal overflow-hidden rtl" dir="rtl">
      {/* Left Side: Visuals & Quotes (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 items-center justify-center overflow-hidden border-l border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
        
        <div className="relative z-10 max-w-lg p-12 text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-12 inline-block p-4 rounded-3xl bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl"
            >
                <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-tr from-amber-500 to-amber-200 rounded-2xl shadow-[0_0_50px_-12px_rgba(245,158,11,0.5)]">
                    <Sparkles className="text-black w-10 h-10" />
                </div>
            </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuote}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <QuoteIcon className="w-10 h-10 text-amber-500/40 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-relaxed tracking-tight">
                {quotes[currentQuote].text}
              </h2>
              <div className="flex items-center justify-center gap-3">
                <div className="h-[1px] w-8 bg-amber-500/40" />
                <p className="text-amber-500 font-medium tracking-widest uppercase text-sm">
                  {quotes[currentQuote].author}
                </p>
                <div className="h-[1px] w-8 bg-amber-500/40" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-10 right-10 flex gap-2">
            {[0,1,2,3].map(i => (
                <div key={i} className={`h-1 rounded-full transition-all duration-1000 ${i === currentQuote ? 'w-8 bg-amber-500' : 'w-2 bg-white/10'}`} />
            ))}
        </div>
      </div>

      {/* Right Side: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tighter">متحف الفكر</h1>
            <p className="text-zinc-500 text-sm">مرحباً بك في ملتقي العقول الراقية</p>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
            
            <div className="flex mb-8 bg-black/40 p-1 rounded-2xl border border-white/5 relative z-10">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-500 ${
                  isLogin ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-zinc-500 hover:text-white"
                }`}
              >
                <LogIn size={16} /> دخول
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-500 ${
                  !isLogin ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-zinc-500 hover:text-white"
                }`}
              >
                <UserPlus size={16} /> تسجيل
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-xs font-bold text-zinc-500 mr-1">الاسم الكامل</label>
                    <div className="relative group">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/60 border border-white/5 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 rounded-2xl py-4 pr-12 pl-4 text-white transition-all outline-none"
                        placeholder="أدخل اسمك الكريم"
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 mr-1">البريد الإلكتروني</label>
                <div className="relative group">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/60 border border-white/5 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 rounded-2xl py-4 pr-12 pl-4 text-white transition-all outline-none"
                    placeholder="name@thought.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-zinc-500">كلمة المرور</label>
                    {isLogin && <button type="button" className="text-[10px] text-amber-500/60 hover:text-amber-500">نسيت كلمة المرور؟</button>}
                </div>
                <div className="relative group">
                  <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/60 border border-white/5 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 rounded-2xl py-4 pr-12 pl-4 text-white transition-all outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isFormLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-400 text-black py-4 rounded-2xl font-bold shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
              >
                {isFormLoading ? "جاري المعالجة..." : isLogin ? "دخول" : "إنشاء حساب"}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute w-full h-[1px] bg-white/5" />
                <span className="relative z-10 bg-zinc-900 px-4 text-xs font-bold text-zinc-600 tracking-widest">أو عبر</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isFormLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 py-4 px-6 rounded-2xl text-black transition-all group disabled:opacity-70 shadow-lg relative overflow-hidden"
                >
                  {isFormLoading ? (
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <div className="absolute left-0 top-0 h-full w-12 flex items-center justify-center bg-white border-r border-gray-200 shadow-[2px_0_10px_rgba(0,0,0,0.05)]">
                          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571c.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                          </svg>
                      </div>
                      <span className="text-base font-bold tracking-wide mr-10 font-sans">المتابعة بحساب Google</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className="text-center mt-8 text-zinc-600 text-xs leading-relaxed">
            باستمرارك، أنت توافق على <span className="text-amber-500/60 cursor-pointer hover:text-amber-500">شروط الخدمة</span> و <span className="text-amber-500/60 cursor-pointer hover:text-amber-500">سياسة الخصوصية</span> لمتحف الفكر.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
