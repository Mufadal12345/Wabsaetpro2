import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { UserAvatar } from './UserAvatar';
import { Home, Compass, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { messages } = useData();

  if (!currentUser) return null;

  const unreadMessagesCount = messages.filter(
    (m) => m.toUserId === currentUser?.id && !m.read
  ).length;

  const items = [
    { path: '/', icon: Home, label: 'الرئيسية' },
    { path: '/ideas', icon: Compass, label: 'استكشاف' },
    { 
      path: '/suggestions', 
      icon: MessageSquare, 
      label: 'الرسائل',
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined
    },
    { path: `/profile/${currentUser.id}`, icon: null, label: 'حسابي', isProfile: true }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#000000] border-t border-white/10 z-[60] px-6 py-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] flex justify-around items-center backdrop-blur-xl">
      {items.map((item) => {
        const isActive = location.pathname === item.path || (item.isProfile && location.pathname.startsWith('/profile/'));
        const Icon = item.icon;
        
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="relative flex flex-col items-center justify-center p-3 transition-all outline-none"
          >
            {item.isProfile ? (
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                <UserAvatar user={currentUser} className="w-7 h-7" />
              </div>
            ) : (
              Icon && <Icon className={`w-7 h-7 transition-all duration-300 ${isActive ? 'text-accent scale-110' : 'text-zinc-500 hover:text-zinc-300'}`} />
            )}
            
            {item.badge && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full shadow-lg font-bold">
                {item.badge}
              </span>
            )}
            
            {isActive && !item.isProfile && (
              <motion.span 
                layoutId="nav-dot"
                className="w-1.5 h-1.5 bg-accent rounded-full absolute -bottom-1"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
