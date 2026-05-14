import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  url: string;
  onClick?: (e: React.MouseEvent) => void;
}

interface Metadata {
  title?: string;
  description?: string;
  image?: string;
  logo?: string;
  publisher?: string;
  url?: string;
}

export const StoryLinkPreview: React.FC<Props> = ({ url, onClick }) => {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVideoPlayer, setIsVideoPlayer] = useState(false);

  useEffect(() => {
    // Check if it's a playable video first
    const canPlay = (ReactPlayer as any).canPlay;
    if (canPlay && canPlay(url)) {
      setIsVideoPlayer(true);
      setLoading(false);
      return;
    }

    // Otherwise fetch metadata
    const fetchMetadata = async () => {
      try {
        // Fetch metadata with screenshot if possible
        const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=true`);
        if (!res.ok) throw new Error('Microlink failed');
        
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          setMetadata({
            title: json.data.title,
            description: json.data.description,
            image: json.data.screenshot?.url || json.data.image?.url,
            logo: json.data.logo?.url,
            publisher: json.data.publisher,
            url: json.data.url
          });
        } else {
          // Generic fallback metadata
          setMetadata({
            title: new URL(url).hostname,
            url: url
          });
        }
      } catch (err) {
        console.error("Failed to fetch link metadata", err);
        // Generic fallback metadata on error
        setMetadata({
          title: new URL(url).hostname,
          url: url
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [url]);

  if (loading) {
    return (
      <div className="w-full max-w-sm mx-auto mt-4 rounded-[22px] overflow-hidden bg-black/30 backdrop-blur-md p-4 animate-pulse border border-white/10">
         <div className="w-full h-32 bg-white/10 rounded-xl mb-3"></div>
         <div className="w-3/4 h-4 bg-white/10 rounded mb-2"></div>
         <div className="w-1/2 h-4 bg-white/10 rounded"></div>
      </div>
    );
  }

  // If it's a playable video, we still show the card but with a play button
  const isVideo = isVideoPlayer;

  if (!metadata && !loading) {
    // If no metadata but is video, show a generic video card
    if (isVideo) {
      setMetadata({
        title: "فيديو مرئي",
        description: "انقر لتشغيل الفيديو ومعاينة المصدر",
        image: `https://img.youtube.com/vi/${url.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg`,
        publisher: new URL(url).hostname
      });
    }
  }

  if (!metadata && !loading) return null;

  return (
    <motion.a 
      href={metadata?.url || url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) {
          e.preventDefault();
          onClick(e);
        }
      }}
      className="block w-full max-w-[18rem] sm:max-w-sm mx-auto rounded-[32px] overflow-hidden bg-zinc-900/90 backdrop-blur-3xl border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.6)] transition-all hover:scale-[1.03] active:scale-[0.98] group relative"
    >
      {/* Browser Bar */}
      <div className="h-10 bg-zinc-800/80 border-b border-white/10 flex items-center px-5 gap-3">
         <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/40" />
            <div className="w-3 h-3 rounded-full bg-amber-500/40" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/40" />
         </div>
         <div className="flex-1 bg-black/40 rounded-lg h-6 flex items-center px-3 border border-white/5">
            <span className="text-[10px] text-zinc-500 truncate font-mono tracking-tight">{new URL(url).hostname}</span>
         </div>
         {isVideo && (
           <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/20 border border-accent/20">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(255,70,0,0.8)]" />
              <span className="text-[9px] text-accent font-black uppercase tracking-widest">Live</span>
           </div>
         )}
      </div>

      <div className="w-full h-64 overflow-hidden relative group-hover:h-72 transition-all duration-700 bg-zinc-950 flex items-center justify-center">
         {metadata?.image ? (
           <>
            <img 
              src={metadata.image} 
              alt={metadata?.title} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://unavatar.io/${new URL(url).hostname}`;
              }}
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center z-10 transition-transform group-hover:scale-110 duration-700">
                <div className="w-20 h-20 rounded-full bg-accent/90 flex items-center justify-center shadow-[0_0_50px_rgba(255,70,0,0.5)] border border-white/30 backdrop-blur-md">
                   <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-2" />
                </div>
              </div>
            )}
           </>
         ) : (
           <div className="w-full h-full flex flex-col items-center justify-center border-b border-white/5 relative overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent)]" />
              <div className="p-7 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 relative z-10 shadow-2xl">
                 <ExternalLink size={40} className="text-white/30" />
              </div>
           </div>
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80"></div>
      </div>

      <div className="p-7 text-right relative bg-gradient-to-b from-transparent to-black/30 font-tajawal">
        {metadata?.logo && (
          <div className="absolute -top-10 right-8 p-2 rounded-[22px] bg-zinc-900 border-2 border-white/10 shadow-2xl z-20 transition-transform group-hover:-translate-y-2">
            <img src={metadata.logo} alt="Site Icon" className="w-12 h-12 rounded-xl bg-white object-contain p-1" />
          </div>
        )}
        <h3 className="text-white font-black text-xl line-clamp-1 mb-2.5 leading-tight group-hover:text-accent transition-colors" dir="auto">{metadata?.title || url}</h3>
        <p className="text-white/50 text-sm line-clamp-2 mb-6 leading-relaxed font-light min-h-[3rem]" dir="auto">{metadata?.description || "انقر للمعاينة المباشرة واستكشاف هذا المحتوى في المتصفح الآمن..."}</p>
        
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
           <div className="flex items-center gap-3 text-accent font-black">
              <span className="text-[11px] uppercase tracking-[0.25em] relative">
                {isVideo ? 'تشغيل الآن' : 'استكشاف'}
                <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(255,70,0,0.6)]"></span>
              </span>
              <div className="p-2 rounded-full bg-accent/10 border border-accent/20 group-hover:bg-accent group-hover:text-black transition-all shadow-lg">
                <ExternalLink size={14} />
              </div>
           </div>
           <div className="flex flex-col items-end">
             <span className="text-[11px] text-zinc-500 font-mono tracking-tight font-bold">{metadata?.publisher || new URL(url).hostname}</span>
             <span className="text-[9px] text-zinc-700 font-mono uppercase mt-1 tracking-widest">{isVideo ? 'Media Content' : 'Encrypted Mirror'}</span>
           </div>
        </div>
      </div>
    </motion.a>
  );
};
