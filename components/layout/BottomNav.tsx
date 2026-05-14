import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Lightbulb, Play, User as UserIcon, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserAvatar } from '../UserAvatar';

interface Props {
  userAvatar?: string;
}

export const BottomNav: React.FC<Props> = () => {
    const [isVisible, setIsVisible] = useState(true);
    const { scrollY } = useScroll();
    const location = useLocation();
    const { currentUser } = useAuth();
    
    // تتبع التمرير للإخفاء والظهور الذكي
    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest > previous && latest > 50) {
            setIsVisible(false);
        } else {
            setIsVisible(true);
        }
    });

    const profilePath = currentUser?.id ? `/profile/${currentUser.id}` : '/profile';

    const navItems = [
        { to: '/', icon: <Home size={20} />, label: 'الرئيسية' },
        { to: '/search', icon: <Search size={20} />, label: 'بحث' },
        { to: '/ideas', icon: <Lightbulb size={20} />, label: 'أفكار' },
        { to: '/visuals', icon: <Play size={20} />, label: 'المرئي' },
        { 
            to: profilePath, 
            icon: currentUser ? (
                <UserAvatar user={{ id: currentUser.id, name: currentUser.name || 'U', photoURL: currentUser.photoURL }} className="w-[24px] h-[24px]" />
            ) : <UserIcon size={20} />, 
            label: currentUser ? '' : 'أنا',
            isProfile: true
        },
    ];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.nav
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 250 }}
                    className="fixed bottom-5 inset-x-0 z-[1000] px-4 flex justify-center md:hidden pointer-events-none"
                >
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl h-14 flex items-center justify-around shadow-2xl shadow-black/40 pointer-events-auto w-full max-w-sm">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.to || (item.isProfile && location.pathname.startsWith('/profile/'));
                            
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={`
                                        flex flex-col items-center justify-center transition-all duration-300 relative px-2 py-1
                                        ${isActive ? 'text-accent scale-105' : 'text-zinc-500 hover:text-zinc-300'}
                                    `}
                                >
                                    {item.icon}
                                    {item.label && <span className="text-[9px] font-medium mt-0.5">{item.label}</span>}
                                </NavLink>
                            );
                        })}
                    </div>
                </motion.nav>
            )}
        </AnimatePresence>
    );
};
