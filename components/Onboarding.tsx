import React, { useState, useEffect } from "react";
import { Icons } from "./Icons";

const ONBOARDING_STEPS = [
  {
    title: "مرحباً بك في متحف الفكر",
    description: "مساحتك الآمنة لاستكشاف الأفكار، تبادل المعرفة، وتطوير مهاراتك.",
    icon: <Icons.BookOpen className="w-24 h-24 text-pink-500" />
  },
  {
    title: "شارك أفكارك وإبداعاتك",
    description: "انشر مقالاتك، أفكارك، واقتباساتك المفضلة لتلهم الآخرين وتتفاعل معهم.",
    icon: <Icons.PenTool className="w-24 h-24 text-purple-500" />
  },
  {
    title: "تطوير المهارات",
    description: "اكتشف مسارات تعليمية، مصادر، وأدوات تساعدك على النمو المستمر.",
    icon: <Icons.Target className="w-24 h-24 text-indigo-500" />
  },
  {
    title: "مجتمع داعم",
    description: "تواصل مع مفكرين ومبدعين آخرين، وكن جزءاً من مجتمعنا الراقي.",
    icon: <Icons.Users className="w-24 h-24 text-blue-500" />
  }
];

export const Onboarding: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem("muf_onboarding_completed");
      if (!hasCompleted) {
        setIsVisible(true);
      }
    } catch (e) {
      setIsVisible(true);
    }
  }, []);

  const handleComplete = () => {
    try {
      localStorage.setItem("muf_onboarding_completed", "true");
    } catch (e) {}
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] bg-[#000000] flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full text-center space-y-10">
        <div className="animate-bounce-slow bg-white/5 p-8 rounded-full shadow-2xl border border-white/10">
          {step.icon}
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-bold font-amiri gradient-text">{step.title}</h2>
          <p className="text-gray-300 text-lg leading-relaxed">{step.description}</p>
        </div>

        <div className="flex gap-2 justify-center mt-8">
          {ONBOARDING_STEPS.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-gradient-to-r from-pink-500 to-purple-500' : 'w-2 bg-white/20'}`}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-md flex justify-between items-center pb-8 pt-4">
        <button 
          onClick={handleComplete}
          className="text-gray-400 hover:text-white px-4 py-2 transition-colors font-bold"
        >
          تخطي
        </button>
        
        <button 
          onClick={handleNext}
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-pink-500/25 hover:scale-105 transition-transform flex items-center gap-2"
        >
          {currentStep === ONBOARDING_STEPS.length - 1 ? "ابدأ الآن" : "التالي"}
          {currentStep !== ONBOARDING_STEPS.length - 1 && <Icons.ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
