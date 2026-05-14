import { extractYoutubeId, getYoutubeThumbnail } from '../utils';
import { Icons } from './Icons';
import { Idea } from '../types';

export const ProfileMedia = ({ thought, onClick, canViewStats }: { thought: Idea, onClick?: () => void, canViewStats?: boolean }) => {
  const content = thought.content || '';
  const ytId = extractYoutubeId(content);
  
  // Extract custom image from content, or link preview
  const firstUrlMatch = content.match(/(https?:\/\/[^\s]+)/);
  const linkUrl = firstUrlMatch ? firstUrlMatch[0] : null;

  const cleanContent = content.replace(/(https?:\/\/[^\s]+)/g, '').trim();

  return (
    <div 
      onClick={onClick}
      className="aspect-[4/5] sm:aspect-square bg-[#0A0A0A] rounded-2xl overflow-hidden relative group cursor-pointer border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transform will-change-transform"
    >
      {ytId ? (
        <>
          <img
            src={getYoutubeThumbnail(ytId)}
            className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
            alt="Video Thumbnail"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
          <div className="absolute top-3 right-3 bg-black/60 rounded-full p-2 backdrop-blur-md">
            <Icons.Play className="w-4 h-4 text-white fill-current ml-0.5" />
          </div>
        </>
      ) : linkUrl && !ytId ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 group-hover:scale-105 transition-transform duration-700 p-4">
            <Icons.Link className="w-8 h-8 text-accent mx-auto mb-3 opacity-50 transition-opacity group-hover:opacity-100" />
            <span className="text-[10px] sm:text-xs text-white/50 line-clamp-1 font-bold tracking-widest">{new URL(linkUrl).hostname}</span>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#111] to-[#1a1a1a] p-4 group-hover:scale-105 transition-transform duration-700">
           <p className="text-white text-sm sm:text-base font-amiri text-center leading-relaxed line-clamp-4 px-2 opacity-80">{cleanContent}</p>
        </div>
      )}

      {/* Overlay Title */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-10 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
        <h4 className="text-[11px] sm:text-xs text-white font-black line-clamp-1 group-hover:text-amber-500 transition-colors">{thought.title}</h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white/50">
            <Icons.Heart className="w-3 h-3" />
            <span className="text-[10px]">{canViewStats ? (thought.likes || 0) : ''}</span>
          </div>
          {canViewStats && (
            <div className="flex items-center gap-1 text-white/50">
              <Icons.Eye className="w-3 h-3" />
              <span className="text-[10px]">{thought.views || 0}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
