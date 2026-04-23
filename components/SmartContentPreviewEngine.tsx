import React from "react";
import ReactPlayer from "react-player";
import { Browser } from '@capacitor/browser';

interface SmartContentPreviewEngineProps {
  url: string;
  title?: string;
  thumbnail?: string;
}

export const SmartContentPreviewEngine: React.FC<SmartContentPreviewEngineProps> = ({
  url,
  title,
  thumbnail,
}) => {
  const isYoutube = (ReactPlayer as any).canPlay(url);

  if (isYoutube) {
    const Player = ReactPlayer as any;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <Player
          url={url}
          width="100%"
          height="100%"
          controls={true}
          light={thumbnail || true}
        />
      </div>
    );
  }

  // Fallback for non-video links
  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        await Browser.open({ url });
      }}
      className="block w-full text-right p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
    >
      <h4 className="font-bold text-white mb-1">{title || "معاينة الرابط"}</h4>
      <p className="text-sm text-gray-400 truncate">{url}</p>
    </button>
  );
};
