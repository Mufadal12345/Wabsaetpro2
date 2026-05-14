import React, { useMemo, useEffect, useState } from "react";
import { useData } from "../../contexts/DataContext";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { collection, getCountFromServer, getAggregateFromServer, sum } from "firebase/firestore";
import { db } from "../../firebase";

export const AdminDashboard: React.FC = () => {
  const { users, ideas, suggestions, notifications, aboutSections } = useData();
  const navigate = useNavigate();

  const [aggStats, setAggStats] = useState({ views: 0, likes: 0, ideas: 0, users: 0, loaded: false });

  useEffect(() => {
    const fetchAggregates = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, "users"));
        const ideasSnap = await getCountFromServer(collection(db, "ideas"));
        const viewsSnap = await getAggregateFromServer(collection(db, "ideas"), {
          views: sum('views')
        });
        const likesSnap = await getAggregateFromServer(collection(db, "ideas"), {
          likes: sum('likes')
        });
        
        setAggStats({
          users: usersSnap.data().count,
          ideas: ideasSnap.data().count,
          views: viewsSnap.data().views,
          likes: likesSnap.data().likes,
          loaded: true
        });
      } catch (err: any) {
        console.error("Failed to fetch aggregate stats:", err);
      }
    };
    fetchAggregates();
  }, []);

  const totalViews = aggStats.loaded ? aggStats.views : ideas.reduce((acc, idea) => acc + (idea.views || 0), 0);
  const totalLikes = aggStats.loaded ? aggStats.likes : ideas.reduce((acc, idea) => acc + (idea.likes || 0), 0);
  const usersCount = aggStats.loaded ? aggStats.users : users.filter(u => u.role === "user").length;
  const ideasCount = aggStats.loaded ? aggStats.ideas : ideas.length;

  const stats = [
    {
      title: "المستخدمين",
      value: usersCount.toLocaleString("ar-EG"),
      color: "from-blue-500 to-cyan-400",
      link: "/admin/members",
    },
    {
      title: "المدراء",
      value: users.filter(u => u.role !== "user").length,
      color: "from-amber-500 to-yellow-400",
      link: "/admin/members?tab=admins",
    },
    {
      title: "إجمالي المشاهدات",
      value: totalViews.toLocaleString("ar-EG"),
      color: "from-orange-500 to-amber-400",
      link: "/ideas",
    },
    {
      title: "إجمالي الإعجابات",
      value: totalLikes.toLocaleString("ar-EG"),
      color: "from-red-500 to-pink-400",
      link: "/ideas",
    },
    {
      title: "الأفكار والمنشورات",
      value: ideasCount.toLocaleString("ar-EG"),
      color: "from-pink-500 to-rose-400",
      link: "/ideas",
    },
    {
      title: "التنبيهات العامة",
      value: (notifications || []).length,
      color: "from-green-500 to-emerald-400",
      link: "/admin/notifications",
    },
    {
      title: "الرسائل والمقترحات",
      value: suggestions.length,
      color: "from-orange-500 to-yellow-400",
      link: "/admin/messages",
    },
    {
      title: "إدارة الأقسام",
      value: (aboutSections || []).length,
      color: "from-indigo-500 to-blue-400",
      link: "/admin/sections",
    },
  ];

  const [activeTab, setActiveTab] = React.useState<"overview" | "stats" | "activity">("overview");

  // Chart Data preparation (Last 30 days)
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
      
      const dayStart = new Date(d.setHours(0,0,0,0));
      const dayEnd = new Date(d.setHours(23,59,59,999));

      const newUsers = users.filter(u => {
        const uDate = new Date(u.createdAt);
        return uDate >= dayStart && uDate <= dayEnd;
      }).length;

      const newIdeas = ideas.filter(i => {
        const iDate = new Date(i.createdAt);
        return iDate >= dayStart && iDate <= dayEnd;
      }).length;

      data.push({
        name: dateString,
        المستخدمين: newUsers,
        "الأفكار": newIdeas
      });
    }
    return data;
  }, [users, ideas]);

  return (
    <div className="animate-fade-in pb-20 font-tajawal">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-amiri gradient-text">
          لوحة التحكم
        </h1>
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
          {[
            { id: "overview", label: "نظرة عامة" },
            { id: "stats", label: "الإحصائيات" },
            { id: "activity", label: "النشاط الأخير" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? "bg-accent text-white" : "text-gray-400 hover:text-white"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.slice(0, 4).map((stat, idx) => (
              <div
                key={idx}
                onClick={() => navigate(stat.link)}
                className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div
                  className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`}
                ></div>
                <h3 className="text-gray-400 text-sm font-bold mb-2">
                  {stat.title}
                </h3>
                <p className="text-4xl font-bold text-white font-amiri">
                  {stat.value}
                </p>
                <div
                  className={`h-1 w-full bg-gradient-to-r ${stat.color} mt-4 rounded-full opacity-50`}
                ></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Notifications Management */}
            <div className="glass-card p-6 rounded-2xl border border-green-500/30">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🔔</span> نظام التنبيهات الذكي
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                أرسل تنبيهات فورية تظهر لجميع المستخدمين في أعلى الشاشة. يمكن استخدامها للإعلانات الهامة أو التحديثات.
              </p>
              <button
                onClick={() => navigate("/admin/notifications")}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20"
              >
                <span className="text-lg">📢</span> إدارة وإرسال التنبيهات
              </button>
            </div>

            {/* Audit Logs */}
            <div className="glass-card p-6 rounded-2xl border border-blue-500/30">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span> سجل النشاطات (Audit Logs)
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                تتبع التغييرات الحساسة وأنشطة المديرين لضمان الشفافية ومراجعة القرارات الإدارية.
              </p>
              <button
                onClick={() => navigate("/admin/audit")}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
              >
                <span className="text-lg">🔍</span> عرض السجلات
              </button>
            </div>

            {/* Sections Management */}
            <div className="glass-card p-6 rounded-2xl border border-indigo-500/30">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🏗️</span> إدارة هيكل النظام
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                تحكم في أقسام القائمة الجانبية، إخفاء أو إظهار الصفحات الرئيسية، وإدارة محتوى صفحة "عن المشروع".
              </p>
              <button
                onClick={() => navigate("/admin/sections")}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
              >
                <span className="text-lg">🛠️</span> إدارة الأقسام والصفحات
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === "stats" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="glass-card p-6 rounded-2xl border border-white/5"
              >
                <h3 className="text-gray-400 text-xs font-bold mb-2">{stat.title}</h3>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <div className={`h-1 w-12 bg-gradient-to-r ${stat.color} mt-2 rounded-full`}></div>
              </div>
            ))}
          </div>
          
          {/* Charts */}
          <div className="glass-card p-8 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold mb-6">التفاعل والمستخدمين (آخر 30 يوم)</h3>
            <div className="h-80 w-full" style={{ minHeight: 320 }} dir="ltr">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorIdeas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" tick={{fill: '#ffffff50', fontSize: 12}} />
                  <YAxis stroke="#ffffff50" tick={{fill: '#ffffff50', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000000', borderColor: '#ffffff20', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="المستخدمين" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                  <Area type="monotone" dataKey="الأفكار" stroke="#ec4899" fillOpacity={1} fill="url(#colorIdeas)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="glass-card p-8 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold mb-6">توزيع المحتوى</h3>
            <div className="flex flex-wrap gap-4">
              {["فلسفة", "تعليم", "تكنولوجيا", "فن", "أخرى"].map(cat => {
                const count = ideas.filter(i => i.category === cat).length;
                const percentage = ideas.length > 0 ? (count / ideas.length) * 100 : 0;
                return (
                  <div key={cat} className="flex-1 min-w-[150px] bg-white/5 p-4 rounded-2xl">
                    <p className="text-xs text-gray-400 mb-1">{cat}</p>
                    <p className="text-xl font-bold mb-2">{count}</p>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">👥</span> أحدث الأعضاء
            </h3>
            <div className="space-y-4">
              {users.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("ar-EG")}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/admin/members")}
              className="w-full mt-4 py-2 text-sm text-center text-pink-400 hover:text-pink-300 border border-white/10 rounded-xl hover:bg-white/5 transition-all"
            >
              عرض جميع الأعضاء
            </button>
          </div>

          {/* Recent Suggestions */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📩</span> أحدث الرسائل
            </h3>
            <div className="space-y-4">
              {suggestions.slice(0, 5).map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 bg-white/5 rounded-xl border-r-4 border-yellow-500"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm">{msg.title}</h4>
                    <span
                      className={`text-[10px] px-2 rounded-full ${msg.status === "pending" ? "bg-yellow-500/20 text-yellow-300" : "bg-green-500/20 text-green-300"}`}
                    >
                      {msg.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-1">
                    {msg.content}
                  </p>
                </div>
              ))}
              {suggestions.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  لا توجد رسائل جديدة
                </p>
              )}
            </div>
            <button
              onClick={() => navigate("/admin/messages")}
              className="w-full mt-4 py-2 text-sm text-center text-pink-400 hover:text-pink-300 border border-white/10 rounded-xl hover:bg-white/5 transition-all"
            >
              إدارة الرسائل
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
