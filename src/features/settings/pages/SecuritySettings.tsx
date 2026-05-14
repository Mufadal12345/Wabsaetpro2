import React, { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { AuthService } from '../../auth/services/auth.service';
import { Shield, Mail, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export const AccountSecurity: React.FC = () => {
  const { profile } = useAuth();
  const [email, setEmail] = useState(profile?.email || '');
  const [password, setPassword] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [showReauth, setShowReauth] = useState(false);
  const [pendingAction, setPendingAction] = useState<'email' | 'password' | null>(null);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingAction('email');
    setShowReauth(true);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' });
      return;
    }
    setPendingAction('password');
    setShowReauth(true);
  };

  const confirmReauth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) return;

    setMessage(null);
    if (pendingAction === 'email') setIsUpdatingEmail(true);
    else setIsUpdatingPassword(true);

    try {
      await AuthService.reauthenticate(currentPassword);
      
      if (pendingAction === 'email') {
        await AuthService.updateEmail(email);
        setMessage({ type: 'success', text: 'تم تحديث البريد الإلكتروني بنجاح' });
      } else {
        await AuthService.updatePassword(password);
        setMessage({ type: 'success', text: 'تم تحديث كلمة المرور بنجاح' });
        setPassword('');
      }
      
      setShowReauth(false);
      setCurrentPassword('');
      setPendingAction(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'فشل التوثيق: كلمة المرور الحالية غير صحيحة.' });
    } finally {
      setIsUpdatingEmail(false);
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-6 h-6 text-pink-500" />
        <h2 className="text-2xl font-bold">الأمان والحماية</h2>
      </div>

      {showReauth && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111111] border border-white/10 p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl"
          >
            <div className="text-center space-y-2">
              <Lock className="w-12 h-12 text-pink-500 mx-auto" />
              <h3 className="text-xl font-bold">تأكيد الهوية</h3>
              <p className="text-gray-400 text-sm">يرجى إدخال كلمة المرور الحالية للمتابعة</p>
            </div>
            <form onSubmit={confirmReauth} className="space-y-4">
              <input 
                type="password"
                autoFocus
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="كلمة المرور الحالية"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 outline-none focus:border-pink-500/50 transition-all font-bold"
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowReauth(false)}
                  className="flex-1 py-3 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition-all text-sm"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  disabled={!currentPassword || isUpdatingEmail || isUpdatingPassword}
                  className="flex-1 py-3 rounded-2xl bg-pink-600 text-white font-bold hover:bg-pink-500 transition-all text-sm"
                >
                  {isUpdatingEmail || isUpdatingPassword ? 'جاري التحقق...' : 'تأكيد'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </motion.div>
      )}

      {/* Email Section */}
      <section className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
        <div className="flex items-center gap-2 text-gray-300">
          <Mail className="w-5 h-5" />
          <h3 className="font-bold">تغيير البريد الإلكتروني</h3>
        </div>
        <form onSubmit={handleUpdateEmail} className="flex gap-2">
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-pink-500/50 transition-colors"
            placeholder="البريد الإلكتروني الجديد"
          />
          <button 
            type="submit"
            disabled={isUpdatingEmail || email === profile?.email}
            className="px-6 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:hover:bg-pink-600 text-white rounded-xl font-bold transition-all"
          >
            {isUpdatingEmail ? 'جاري التحديث...' : 'تحديث'}
          </button>
        </form>
      </section>

      {/* Password Section */}
      <section className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
        <div className="flex items-center gap-2 text-gray-300">
          <Lock className="w-5 h-5" />
          <h3 className="font-bold">تغيير كلمة المرور</h3>
        </div>
        <form onSubmit={handleUpdatePassword} className="flex gap-2">
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-pink-500/50 transition-colors"
            placeholder="كلمة المرور الجديدة"
          />
          <button 
            type="submit"
            disabled={isUpdatingPassword || !password}
            className="px-6 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:hover:bg-pink-600 text-white rounded-xl font-bold transition-all"
          >
            {isUpdatingPassword ? 'جاري التحديث...' : 'تحديث'}
          </button>
        </form>
      </section>

      {/* MFA Info */}
      <section className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
        <h3 className="font-bold text-gray-300">المصادقة الثنائية (MFA)</h3>
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
          <div className="flex flex-col">
            <span className="text-sm font-medium">الحالة</span>
            <span className="text-xs text-gray-500">متاحة لموفري الخدمات الخارجيين فقط حالياً</span>
          </div>
          <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full border border-white/10">
            غير مفعلة
          </span>
        </div>
      </section>
    </div>
  );
};
