import React from "react";
import { Logo } from "../components/Logo";
import { Icons } from "../components/Icons";

export const About: React.FC = () => {
  return (
    <div className="animate-fade-in pb-20 max-w-4xl mx-auto font-tajawal">
      {/* Header Section */}
      <div className="glass-card rounded-3xl p-10 text-center border-t-4 border-pink-500 relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-500/10 to-transparent pointer-events-none"></div>

        <div className="flex justify-center mb-8">
          <Logo size={180} />
        </div>

        <h1 className="text-4xl font-bold font-amiri gradient-text mb-2">
          متحف الفكر
        </h1>
        <p className="text-xl text-gray-300 font-amiri mb-4">
          بوابة الإبداع الفكري الرقمية
        </p>
        <div className="inline-block bg-white/10 px-4 py-1 rounded-full text-sm text-pink-300 mb-8 font-mono">
          الإصدار 2.2.0
        </div>

        <p className="text-gray-300 leading-relaxed max-w-2xl mx-auto text-lg">
          منصة رقمية متكاملة تهدف إلى جمع العقول المبدعة في مساحة آمنة ومحفزة، لتبادل المعرفة، توثيق الأفكار، وبناء مجتمع واعٍ يساهم في إثراء المحتوى الفكري.
        </p>
      </div>

      {/* Core Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-pink-500/30 transition-colors">
          <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4 text-pink-400">
            <Icons.Lightbulb className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">توثيق الأفكار</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            مساحة مخصصة لكتابة، حفظ، ومشاركة أفكارك الإبداعية مع مجتمع يقدر المعرفة ويدعم الابتكار.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 text-purple-400">
            <Icons.Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">مجتمع تفاعلي</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            تواصل مع مفكرين ومبدعين من مختلف المجالات، تبادل الآراء، وساهم في نقاشات بناءة وهادفة.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 text-blue-400">
            <Icons.BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">محتوى معرفي</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            مكتبة متنامية من المقالات، الفلسفات، والعبارات الملهمة التي تثري العقل وتوسع المدارك.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-green-500/30 transition-colors">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 text-green-400">
            <Icons.TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">تطوير مستمر</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            دورات ومسارات تعليمية مصممة خصيصاً لتطوير مهاراتك الشخصية والمهنية في بيئة محفزة.
          </p>
        </div>
      </div>

      {/* Project Owner & Team */}
      <div className="glass-card rounded-3xl p-8 border border-white/5 mb-8 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-right">
          <h2 className="text-2xl font-bold text-white mb-2">فريق العمل</h2>
          <p className="text-gray-400 mb-6">
            تم بناء هذا المشروع بشغف ليكون منارة للمعرفة والإبداع في العالم الرقمي.
          </p>
          
          <div className="bg-white/5 p-4 rounded-2xl inline-block text-right w-full md:w-auto">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">صاحبة فكرة المشروع والمؤسس</p>
            <p className="text-pink-400 font-bold text-xl">رشا سعاد الشعيب</p>
            <p className="text-sm text-gray-400 mt-1">رؤيتنا هي خلق بيئة رقمية ترتقي بالفكر الإنساني وتدعم الإبداع بلا حدود.</p>
          </div>
        </div>
        <div className="hidden md:flex w-32 h-32 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full items-center justify-center border-4 border-white/5">
          <Icons.Award className="w-12 h-12 text-pink-400" />
        </div>
      </div>

      {/* Contact & Links */}
      <div className="flex justify-center">
        <div className="glass-card p-6 rounded-2xl border border-white/5 text-center max-w-md w-full">
          <Icons.Shield className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">الخصوصية والشروط</h3>
          <p className="text-gray-400 text-sm mb-4">
            نحن نلتزم بحماية بياناتك وخصوصيتك بأعلى المعايير الأمنية.
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <button className="text-gray-500 hover:text-white transition-colors">سياسة الخصوصية</button>
            <span className="text-gray-700">•</span>
            <button className="text-gray-500 hover:text-white transition-colors">شروط الاستخدام</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          تم التطوير بواسطة <span className="text-gray-400 font-bold">فريق متحف الفكر</span> &copy; 2026
        </p>
      </div>
    </div>
  );
};
