import React from "react";
import { useQuery } from "@tanstack/react-query";

interface LinkPreviewProps {
  url: string;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ url }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["linkPreview", url],
    queryFn: async () => {
      const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
    staleTime: 1000 * 60 * 60 * 24, // cache for 24h
  });

  if (isLoading) {
    return (
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 animate-pulse flex min-h-[100px] overflow-hidden">
        <div className="w-24 sm:w-32 h-24 sm:h-auto bg-white/10 rounded-r-2xl shrink-0" />
        <div className="p-4 flex-1 space-y-3">
          <div className="h-4 bg-white/10 rounded w-3/4 shadow-sm" />
          <div className="h-3 bg-white/10 rounded w-1/2 shadow-sm" />
        </div>
      </div>
    );
  }

  if (error || !data || !data.data || !data.data.title) return null;

  const { title, description, image, publisher } = data.data;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 block rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:bg-white/10 transition-colors group shadow-lg contain-layout will-change-transform transform-gpu"
      onClick={(e) => e.stopPropagation()} // Prevent selecting the idea
    >
      <div className="flex flex-col sm:flex-row min-h-[100px]">
        {image?.url && (
          <div className="sm:w-32 h-32 sm:h-auto shrink-0 border-b sm:border-b-0 sm:border-l border-white/10 relative overflow-hidden bg-black/20">
            <img
              src={image.url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
        <div className="p-4 flex flex-col justify-center flex-1">
          <h4 className="text-sm font-bold text-white line-clamp-1 mb-1 font-amiri">{title}</h4>
          {description && (
            <p className="text-xs text-gray-400 line-clamp-2 mb-2 leading-relaxed">
              {description}
            </p>
          )}
          <div className="text-[10px] text-accent font-bold truncate flex items-center gap-1">
            {publisher && <span>{publisher} • </span>}
            <span className="truncate">{new URL(url).hostname.replace("www.", "")}</span>
          </div>
        </div>
      </div>
    </a>
  );
};
