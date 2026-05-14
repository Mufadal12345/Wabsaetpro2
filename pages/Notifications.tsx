import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { Bell, MessageCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'comments' | 'social' | 'system'>('all');
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    return () => unsubscribe();
  }, [user]);

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'comments') return n.type === 'comment';
    if (activeTab === 'social') return ['like', 'follow'].includes(n.type);
    if (activeTab === 'system') return ['admin', 'admin_message', 'suggestion_reply'].includes(n.type) || !['comment', 'like', 'follow'].includes(n.type);
    return true;
  });

  const markAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadNotifs = notifications.filter(n => !n.isRead);
    if (unreadNotifs.length === 0) return;
    
    const batch = writeBatch(db);
    unreadNotifs.forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.update(ref, { isRead: true });
    });
    await batch.commit();
  };

  const tabs = [
    { id: 'all', label: 'الكل', icon: Bell },
    { id: 'comments', label: 'التعليقات', icon: MessageCircle },
    { id: 'social', label: 'تفاعل', icon: CheckCircle2 },
    { id: 'system', label: 'النظام', icon: ShieldAlert },
  ];

  return (
    <div className="animate-fade-in min-h-screen bg-[#000000] pt-4 pb-24 px-4 font-tajawal">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-[#0A0A0A] p-4 rounded-3xl border border-white/5 sticky top-4 z-40 backdrop-blur-xl">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="text-accent" size={20} /> التنبيهات
          </h1>
          <button onClick={markAllAsRead} className="text-[10px] text-zinc-500 hover:text-accent font-bold transition-colors bg-white/5 px-3 py-1.5 rounded-full">
            تحديد الكل كمقروء
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === 'all' 
              ? notifications.filter(n => !n.isRead).length 
              : notifications.filter(n => !n.isRead && (
                tab.id === 'comments' ? n.type === 'comment' :
                tab.id === 'social' ? ['like', 'follow'].includes(n.type) :
                tab.id === 'system' ? (['admin', 'admin_message', 'suggestion_reply'].includes(n.type) || !['comment', 'like', 'follow'].includes(n.type)) : false
              )).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl whitespace-nowrap transition-all border ${
                  isActive 
                    ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' 
                    : 'bg-[#0A0A0A] text-zinc-500 border-white/5 hover:border-white/10'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-bold">{tab.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold ${
                    isActive ? 'bg-white text-accent' : 'bg-accent text-white'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {filteredNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-[#0A0A0A] rounded-full flex items-center justify-center border border-white/5">
                <Bell size={24} className="text-zinc-800" />
              </div>
              <p className="text-zinc-600 font-bold text-sm">لا توجد تنبيهات في هذا القسم</p>
            </div>
          )}
          {filteredNotifications.map((n: any) => (
            <div 
              key={n.id} 
              onClick={() => markAsRead(n.id, n.isRead)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer group ${n.isRead ? 'bg-[#0A0A0A]/40 border-white/5 grayscale-[0.5]' : 'bg-[#0A0A0A] border-[#FF4600]/30 shadow-xl shadow-[#FF4600]/5 ring-1 ring-[#FF4600]/10'}`}
            >
              <div className="flex gap-4 items-start">
                <div className={`mt-1 shrink-0 p-2.5 rounded-2xl ${
                  n.type === 'comment' ? 'bg-blue-500/10 text-blue-400' :
                  (['admin', 'admin_message'].includes(n.type)) ? 'bg-red-500/10 text-red-400' :
                  n.type === 'suggestion_reply' ? 'bg-green-500/10 text-green-400' :
                  ['like', 'follow'].includes(n.type) ? 'bg-pink-500/10 text-pink-400' :
                  'bg-accent/10 text-accent'
                }`}>
                  {n.type === 'comment' && <MessageCircle size={18} />}
                  {(n.type === 'admin' || n.type === 'admin_message') && <ShieldAlert size={18} />}
                  {n.type === 'suggestion_reply' && <CheckCircle2 size={18} />}
                  {n.type === 'like' && <Bell size={18} />}
                  {n.type === 'follow' && <CheckCircle2 size={18} />}
                  {(!['comment', 'admin', 'admin_message', 'suggestion_reply', 'like', 'follow'].includes(n.type)) && <Bell size={18} />}
                </div>
                <div className="flex-1">
                  <p className={`text-[13px] leading-relaxed ${n.isRead ? 'text-zinc-400' : 'text-white font-bold'}`}>{n.content}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[9px] text-zinc-600 font-mono font-bold tracking-tighter">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString('ar-EU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : "الآن"}
                    </span>
                    {!n.isRead && (
                      <div className="w-1.5 h-1.5 bg-accent rounded-full shadow-lg shadow-accent/50" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
