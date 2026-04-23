import React, { useMemo, useState } from "react";
import { useData } from "../contexts/DataContext";
import { CardSkeleton } from "../components/Skeletons";
import { QuickPost } from "../components/home/QuickPost";
import { FeedTabs, FeedTab } from "../components/home/FeedTabs";
import { IdeaCard } from "../components/home/IdeaCard";
import { Sidebar } from "../components/home/Sidebar";
import { AdminOverlay } from "../components/home/AdminOverlay";
import InfiniteScroll from "react-infinite-scroll-component";

export const Home: React.FC = () => {
  const { ideas, users, loadingData } = useData();
  const [activeTab, setActiveTab] = useState<FeedTab>("for_you");
  const [itemsToShow, setItemsToShow] = useState(10);

  // Filter out deleted items first
  const activeIdeas = useMemo(() => ideas.filter(i => !i.deleted), [ideas]);

  const sortedIdeas = useMemo(() => {
    let sorted = [...activeIdeas];
    
    if (activeTab === "trending") {
      sorted.sort((a, b) => (b.likes + b.views) - (a.likes + a.views));
    } else if (activeTab === "latest" || activeTab === "for_you") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return sorted;
  }, [activeIdeas, activeTab]);

  const displayedIdeas = sortedIdeas.slice(0, itemsToShow);

  const loadMore = () => setItemsToShow(prev => prev + 10);

  return (
    <div className="font-tajawal flex flex-col lg:flex-row gap-8">
      {/* Main Feed Content (Left side on LTR, Right on RTL) */}
      <div className="flex-1 max-w-2xl mx-auto w-full">
        <QuickPost />
        
        <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div id="scrollableFeed" className="pb-24">
          {loadingData && displayedIdeas.length === 0 ? (
            <div className="space-y-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : displayedIdeas.length > 0 ? (
             <InfiniteScroll
                dataLength={displayedIdeas.length}
                next={loadMore}
                hasMore={displayedIdeas.length < sortedIdeas.length}
                loader={<div className="text-center py-6 text-gray-500 font-bold">جاري تحميل المزيد...</div>}
                style={{ overflow: 'visible' }} // Fix for some scroll jumps
             >
                <div className="space-y-6">
                  {displayedIdeas.map((idea) => {
                    const author = users.find(u => u.id === idea.authorId);
                    return (
                      <IdeaCard 
                         key={idea.id} 
                         idea={idea} 
                         author={author} 
                      />
                    );
                  })}
                </div>
             </InfiniteScroll>
          ) : (
            <div className="text-center py-20 glass-card rounded-[2rem] border border-dashed border-white/10">
              <p className="text-gray-500 text-lg">لا توجد أفكار لعرضها حالياً.</p>
              <p className="text-gray-600 text-sm mt-2">كن أول من ينشر في هذا القسم!</p>
            </div>
          )}
        </div>
      </div>

      <Sidebar ideas={activeIdeas} />
      <AdminOverlay />
    </div>
  );
};

