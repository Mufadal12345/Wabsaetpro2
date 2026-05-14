import React from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { Activity, Lightbulb, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export const ActivitySettings: React.FC = () => {
  const { profile } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['user-activity', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      // Fetch user's ideas
      const ideasRef = collection(db, 'ideas');
      const qIdeas = query(
        ideasRef, 
        where('userId', '==', profile.id), 
        orderBy('createdAt', 'desc'), 
        limit(10)
      );
      
      const ideasSnap = await getDocs(qIdeas);
      
      return ideasSnap.docs.map(doc => ({
        id: doc.id,
        type: 'idea',
        title: doc.data().title || 'فكرة جديدة',
        date: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        icon: Lightbulb,
        color: 'text-yellow-400'
      }));
    },
    enabled: !!profile?.id
  });

  if (isLoading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Activity className="w-6 h-6 text-pink-500" />
        <h2 className="text-2xl font-bold">سجل النشاط</h2>
      </div>

      <div className="space-y-4">
        {activities?.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/5">
            <Clock className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">لا يوجد نشاط مسجل حتى الآن.</p>
          </div>
        ) : (
          activities?.map((act, index) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-4 rounded-2xl border border-white/5 bg-white/5 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer"
            >
              <div className={`p-3 rounded-xl bg-white/5 ${act.color}`}>
                <act.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-200">{act.title}</h4>
                <p className="text-[10px] text-gray-500 mt-1">
                  {new Date(act.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-gray-500 font-mono">
                {act.type === 'idea' ? 'فكرة' : 'مشاركة'}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
