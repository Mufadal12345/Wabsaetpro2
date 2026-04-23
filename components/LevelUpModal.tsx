import React, { useEffect, useState } from "react";
import { Icons } from "./Icons";
import { LevelInfo } from "../data/levels";

interface LevelUpModalProps {
  levelInfo: LevelInfo;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ levelInfo, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay for animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade out animation
  };

  return (
    <div className={`fixed inset-0 z-[110] flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100 backdrop-blur-sm bg-black/60' : 'opacity-0 pointer-events-none'}`}>
      <div 
        className={`bg-[#0f172a] border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl transition-all duration-500 transform ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full p-1 shadow-lg shadow-orange-500/50 animate-bounce-slow">
            <div className="w-full h-full bg-[#0f172a] rounded-full flex items-center justify-center">
              <Icons.Star className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="mt-10 text-center space-y-2">
          <h2 className="text-2xl font-bold font-amiri text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            تمت الترقية إلى المستوى {levelInfo.level}
          </h2>
          <h3 className="text-xl text-white font-bold">{levelInfo.title}</h3>
          <p className="text-gray-400 text-sm">{levelInfo.description}</p>
        </div>

        <div className="mt-8 space-y-6">
          {levelInfo.unlockedFeatures.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-pink-400 flex items-center gap-2">
                <Icons.Unlock className="w-4 h-4" />
                ميزات جديدة (Unlocked Features)
              </h4>
              <ul className="space-y-2">
                {levelInfo.unlockedFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300 bg-white/5 p-2 rounded-lg">
                    <Icons.Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {levelInfo.newCapabilities.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                <Icons.Zap className="w-4 h-4" />
                ما يمكنك فعله الآن (New Capabilities)
              </h4>
              <ul className="space-y-2">
                {levelInfo.newCapabilities.map((cap, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300 bg-white/5 p-2 rounded-lg">
                    <Icons.ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8">
          <button 
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
          >
            حسنًا، فهمت
          </button>
        </div>
      </div>
    </div>
  );
};
