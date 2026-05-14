import React, { useState } from 'react';
import { useAuth as useModernAuth } from '../../auth/hooks/useAuth';
import { useAuth as useLegacyAuth } from '../../../../contexts/AuthContext';
import { FirestoreService } from '../../../services/firebase/firebase.service';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../shared/constants/queryKeys';
import { User, Mail, Briefcase, Camera, Check } from 'lucide-react';
import { UserAvatar } from '../../../../components/UserAvatar';

export const AccountSettings: React.FC = () => {
  const { profile } = useModernAuth();
  const { updateCurrentUser } = useLegacyAuth();
  const [name, setName] = useState(profile?.name || '');
  const [specialty, setSpecialty] = useState(profile?.specialty || '');
  const [saved, setSaved] = useState(false);

  const queryClient = useQueryClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    updateCurrentUser({ name, specialty });

    // Optimistic UI Update
    queryClient.setQueryData(QUERY_KEYS.users.currentUser(), (old: any) => ({
      ...old,
      name,
      specialty
    }));

    // Update global users list if necessary
    queryClient.setQueriesData({ queryKey: ["users"] }, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            users: page.users.map((u: any) => u.id === profile.id ? { ...u, name, specialty } : u)
          }))
        };
    });

    try {
      await FirestoreService.updateDocument('users', profile.id, {
        name,
        specialty
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <User className="w-6 h-6 text-pink-500" />
        <h2 className="text-2xl font-bold">إعدادات الملف الشخصي</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <UserAvatar user={profile} className="w-32 h-32 text-4xl" />
            <button className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </button>
          </div>
          <p className="text-xs text-gray-500">انقر لتغيير الصورة الشخصية</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSave} className="flex-1 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <User className="w-4 h-4" /> الاسم الكامل
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 outline-none focus:border-pink-500/50 transition-all font-bold"
              placeholder="أدخل اسمك"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> التخصص أو الاهتمام
            </label>
            <input 
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 outline-none focus:border-pink-500/50 transition-all"
              placeholder="مثال: فنان رقمي، كاتب، باحث"
            />
          </div>

          <div className="space-y-2 opacity-50">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Mail className="w-4 h-4" /> البريد الإلكتروني (يُدار من إعدادات الأمان)
            </label>
            <input 
              type="email"
              value={profile.email}
              disabled
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 outline-none cursor-not-allowed"
            />
          </div>

          <button 
            type="submit"
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
              saved 
                ? 'bg-emerald-600 text-white' 
                : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/20'
            }`}
          >
            {saved ? <><Check className="w-5 h-5" /> تم الحفظ بنجاح</> : 'حفظ التغييرات'}
          </button>
        </form>
      </div>
    </div>
  );
};
