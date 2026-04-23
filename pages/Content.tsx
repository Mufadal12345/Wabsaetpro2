import React, { useMemo, useState } from "react";
import { useData } from "../contexts/DataContext";
import { CATEGORY_ICONS } from "../types";
import { useNavigate } from "react-router-dom";
import { STATIC_CONTENT } from "../data/staticData";
import InfiniteScroll from "react-infinite-scroll-component";
import { CardSkeleton } from "../components/Skeletons";

export const Content: React.FC = () => {
  const { ideas, now, loadingData } = useData();
  const navigate = useNavigate();
  const [itemsToShow, setItemsToShow] = useState(10);

  const contentCategories = ["أدب", "علوم", "تقنية", "فن"];

  const allArticles = useMemo(() => {
    const dbIdeaIds = new Set(ideas.map((i) => i.id));
    const activeStatic = STATIC_CONTENT.filter((s) => !dbIdeaIds.has(s.id));
    const allContent = [...ideas, ...activeStatic];
    return allContent
      .filter(
        (i) =>
          !i.deleted &&
          contentCategories.includes(i.category) &&
          (!i.showAfter || new Date(i.showAfter).getTime() <= now.getTime()),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [ideas, now]);

  const articles = allArticles.slice(0, itemsToShow);

  return (
    <div className="h-full flex flex-col relative animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-20 right-20 w-80 h-80 bg-cyan-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <header className="pb-2 text-center md:text-right">
        <h1 className="text-3xl font-bold text-white neon-text font-tajawal mb-2">
          المحتوى المعرفي
        </h1>
        <p className="text-gray-400 text-sm">
          مقالات علمية، نصوص أدبية، وتحليلات تقنية من نخبة مفكرينا
        </p>
      </header>

      <div className="flex-1 overflow-y-auto pt-0 custom-scrollbar" id="scrollableDiv">
        <InfiniteScroll
          dataLength={articles.length}
          next={() => setItemsToShow(prev => prev + 10)}
          hasMore={articles.length < allArticles.length}
          loader={<div className="text-center py-4 text-gray-500">جاري التحميل...</div>}
          scrollableTarget="scrollableDiv"
        >
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 pb-20 space-y-6">
            {loadingData && articles.length === 0 ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              articles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => navigate("/ideas")}
                  className="glass rounded-2xl overflow-hidden card-hover group cursor-pointer flex flex-col relative break-inside-avoid"
                >
                <div className="h-48 bg-gray-800 relative overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      article.category === "أدب"
                        ? "from-amber-900 to-orange-900"
                        : article.category === "علوم"
                          ? "from-blue-900 to-cyan-900"
                          : article.category === "تقنية"
                            ? "from-indigo-900 to-purple-900"
                            : "from-pink-900 to-rose-900"
                    } opacity-60`}
                  ></div>

                  <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/10">
                    {CATEGORY_ICONS[article.category]} {article.category}
                  </div>

                  <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-gray-900 to-transparent">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] text-white">
                        {article.authorRole === "admin" ? (
                          <i className="fas fa-crown"></i>
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <span className="text-xs font-bold text-white">
                        {article.author}
                      </span>
                    </div>
                  </div>

                  {/* Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-10 group-hover:scale-110 transition duration-700">
                    <span className="text-6xl">
                      {CATEGORY_ICONS[article.category]}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold font-amiri mb-2 text-white group-hover:text-accent transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed mb-4 flex-grow">
                    {article.content}
                  </p>

                  <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-white/5 mt-auto">
                    <span className="flex items-center gap-1">
                      <i className="far fa-calendar"></i>{" "}
                      {new Date(article.createdAt).toLocaleDateString("ar-EG")}
                    </span>
                    <button className="text-accent hover:text-white transition font-bold flex items-center gap-1">
                      اقرأ المزيد{" "}
                      <i className="fas fa-arrow-left text-[10px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
           )}
          </div>
        </InfiniteScroll>
      </div>
    </div>
  );
};
