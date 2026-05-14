import React from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Users, Search } from 'lucide-react';

export const FollowersSettings: React.FC = () => {
  const { profile } = useAuth();

  const { data: followers } = useQuery({
    queryKey: ['followers', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const q = query(collection(db, 'followers'), where('followingId', '==', profile.id));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!profile?.id
  });

  const { data: following } = useQuery({
    queryKey: ['following', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const q = query(collection(db, 'followers'), where('followerId', '==', profile.id));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!profile?.id
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-6 h-6 text-pink-500" />
        <h2 className="text-2xl font-bold">المتابعون والمتابعة</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/5 text-center">
          <p className="text-3xl font-bold text-white">{followers?.length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">متابع</p>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/5 text-center">
          <p className="text-3xl font-bold text-white">{following?.length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">أتابعهم</p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <h3 className="font-bold text-gray-300 px-2">اقتراحات المتابعة</h3>
          <div className="bg-white/5 rounded-3xl border border-white/5 p-8 text-center">
            <Search className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">استكشف مستخدمين جدد واهتمامات مشابهة.</p>
            <button className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all">
              استكشاف المجتمع
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
