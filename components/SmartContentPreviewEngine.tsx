import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { Icons } from "./Icons";

interface SmartContentPreviewEngineProps {
  url: string;
  title?: string;
  thumbnail?: string;
}

export const SmartContentPreviewEngine: React.FC<SmartContentPreviewEngineProps> = ({
  url,
  title: initialTitle,
  thumbnail: initialThumbnail,
}) => {
  const isYoutube = (ReactPlayer as any).canPlay(url);
  const [loading, setLoading] = useState(!isYoutube);
  const [meta, setMeta] = useState<{ title?: string; image?: string; description?: string }>({
    title: initialTitle,
    image: initialThumbnail
  });

  useEffect(() => {
    if (!isYoutube && url && !initialTitle) {
      const fetchMeta = async () => {
        try {
          const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
          const data = await res.json();
          if (data.status === 'success' && data.data) {
            setMeta({
              title: data.data.title || initialTitle,
              image: data.data.image?.url || initialThumbnail,
              description: data.data.description,
            });
          }
        } catch (e) {
          console.error("Failed to fetch link preview", e);
        } finally {
          setLoading(false);
        }
      };
      fetchMeta();
    } else {
      setLoading(false);
    }
  }, [url, isYoutube, initialTitle, initialThumbnail]);

  if (isYoutube) {
    const Player = ReactPlayer as any;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-[#050505] min-h-[180px] sm:min-h-[300px] will-change-transform transform-gpu shadow-2xl relative group/player">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/player:opacity-100 transition-opacity z-10 pointer-events-none" />
        <Player
          key={url}
          url={url}
          width="100%"
          height="100%"
          controls={true}
          light={meta.image || true}
          onError={() => console.log('Player error handled')}
          playIcon={
            <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/40">
              <Icons.Play className="w-8 h-8 text-black fill-current ml-1" />
            </div>
          }
        />
      </div>
    );
  }

  // Fallback for non-video links
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full text-right p-5 rounded-2xl border border-white/5 bg-[#0A0A0A] hover:bg-white/[0.03] transition-all duration-500 group contain-layout will-change-transform transform-gpu shadow-lg hover:shadow-accent/5 hover:border-white/10"
    >
      {loading ? (
        <div className="animate-pulse flex items-center gap-5 min-h-[100px]">
          <div className="w-24 h-24 bg-white/5 rounded-2xl shrink-0"></div>
          <div className="grid gap-3 flex-1">
            <div className="h-4 bg-white/5 rounded-full w-3/4"></div>
            <div className="h-3 bg-white/5 rounded-full w-1/2"></div>
            <div className="h-3 bg-white/5 rounded-full w-1/3"></div>
          </div>
        </div>
      ) : (
        <div className="flex gap-5 items-center min-h-[100px]">
          {meta.image ? (
            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-xl border border-white/5">
              <img 
                src={meta.image} 
                alt={meta.title || "Preview"} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 group-hover:from-amber-500/30 transition-all">
              <Icons.Link className="w-10 h-10 text-amber-500" />
            </div>
          )}
          <div className="overflow-hidden flex-1">
            <h4 className="font-bold text-white text-lg mb-1.5 truncate group-hover:text-amber-500 transition-colors duration-300">{meta.title || initialTitle || "معاينة الرابط"}</h4>
            {meta.description ? (
              <p className="text-sm text-zinc-500 line-clamp-2 mb-2 leading-relaxed">{meta.description}</p>
            ) : (
              <p className="text-sm text-zinc-600 mb-2 italic">لا يوجد وصف متاح لهذا الرابط...</p>
            )}
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                <p className="text-[10px] font-bold text-amber-500/70 truncate tracking-wider uppercase">{new URL(url).hostname}</p>
            </div>
          </div>
        </div>
      )}
    </a>
  );
};
