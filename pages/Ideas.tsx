import React, { useState, useMemo } from "react";
import { Icons } from "../components/Icons";
import { PostSkeleton } from "../components/Skeletons";
import { MediaRouter } from "../components/MediaRouter";
import { UserAvatar } from "../components/UserAvatar";
import { useIdeas, useSocialRelation } from "../hooks/useAppQueries";
import { useFeedActions } from "../hooks/useFeedActions";
import { Modal } from "./admin/Modal";
import { extractYoutubeId } from "../utils";
import { FeedHeader, CATEGORY_ICONS_MAP } from "../components/FeedHeader";

import { Virtuoso } from "react-virtuoso";

export const Ideas: React.FC = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useIdeas(20);

  const [filter, setFilter] = useState("الكل");
  const rawIdeas = useMemo(() => {
    return data?.pages.flatMap((page) => page.ideas) ?? [];
  }, [data]);

  const loadingMoreIdeas = isLoading;

  const { 
      expandedIdeas, 
      playingVideoId, 
      setPlayingVideoId, 
      isModalOpen, 
      setIsModalOpen, 
      editingIdea, 
      setEditingIdea,
      title, 
      setTitle, 
      category, 
      setCategory, 
      content, 
      setContent, 
      handleLike, 
      handleDeleteIdea, 
      handleDeleteComment, 
      handleFollow, 
      toggleExpand, 
      handleViewIdea,
      handleUpdateIdea, 
      handleOpenCreateModal, 
      handleSubmit,
      currentUser,
      users,
      follows,
      comments,
  } = useFeedActions();

  // Get following IDs for feed filter
  const { data: socialRelation } = useSocialRelation(currentUser?.id || "");
  const followingIds = socialRelation?.following || [];

  const visibleIdeas = useMemo(() => {
    let all = [...rawIdeas];
    if (filter !== "الكل") {
      all = all.filter((idea) => idea.category === filter);
    }
    
    // Only text and image ideas, no Youtube links
    all = all.filter(
      (idea) => idea.type !== "video" && !extractYoutubeId(idea.content || "")
    );

    // Only from followed users or current user
    if (currentUser) {
      all = all.filter(idea => followingIds.includes(idea.authorId) || idea.authorId === currentUser.id);
    }
    
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return all;
  }, [rawIdeas, filter, followingIds, currentUser]);

  return (
    <div className="animate-fade-in font-tajawal">
      <FeedHeader 
        currentUser={currentUser} 
        filter={filter} 
        setFilter={setFilter} 
        handleOpenCreateModal={handleOpenCreateModal} 
      />
      
      <div className="max-w-6xl mx-auto px-1 sm:px-2 pt-2">
        {loadingMoreIdeas && visibleIdeas.length === 0 ? (
          <div className="space-y-6 pt-4 px-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : (
          <Virtuoso
            className="will-change-transform transform-gpu overscroll-y-contain !scroll-smooth"
            useWindowScroll
            data={visibleIdeas}
            endReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            increaseViewportBy={300}
            itemContent={(_index, idea) => (
              <div className="pb-3 pt-1 px-1 md:px-0">
                <MediaRouter
                  context="feed"
                  idea={idea}
                  currentUser={currentUser}
                  users={users}
                  follows={follows}
                  comments={comments}
                  expandedIdeas={expandedIdeas}
                  toggleExpand={toggleExpand}
                  handleFollow={handleFollow}
                  handleViewIdea={handleViewIdea}
                  handleDeleteIdea={handleDeleteIdea}
                  handleDeleteComment={handleDeleteComment}
                  handleUpdateIdea={handleUpdateIdea}
                  playingVideoId={playingVideoId}
                  setPlayingVideoId={setPlayingVideoId}
                  handleLike={handleLike}
                  isOwnProfile={idea.authorId === currentUser?.id}
                />
              </div>
            )}
            components={{
              Footer: () => (
                <div className="h-24 w-full flex items-center justify-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-accent">
                      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-bold">جاري تحميل المزيد...</span>
                    </div>
                  )}
                </div>
              )
            }}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIdea(null);
        }}
        title={editingIdea ? "تعديل المنشور" : "✨ إضافة منشور جديد"}
      >
        <div className="space-y-6 font-tajawal pb-6">
          <div className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="shrink-0">
                <UserAvatar user={{ id: currentUser?.id || '', name: currentUser?.name || 'U', photoURL: currentUser?.photoURL }} className="w-14 h-14" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-lg">
                  {currentUser?.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 opacity-70">
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Icons.Globe className="w-3 h-3" /> عام
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                placeholder="عنوان الفكرة (اختياري)..."
                className="w-full bg-transparent text-xl font-bold text-white placeholder-gray-600 border-none focus:ring-0 px-2 transition-all outline-none"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="شاركنا ما يدور في ذهنك بحرية... (يمكنك إضافة روابط وسيتم معاينتها)"
                className="w-full bg-transparent text-lg text-gray-300 placeholder-gray-600 border-none focus:ring-0 px-2 h-48 resize-none transition-all outline-none overflow-y-auto custom-scrollbar leading-relaxed"
              ></textarea>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-2">
            <div className="w-full sm:w-1/2 flex items-center bg-[#111111] border border-white/5 rounded-2xl px-4 py-3 hover:bg-white/5 transition-colors">
              <Icons.Layout className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent border-none text-gray-300 font-bold focus:ring-0 outline-none appearance-none pr-2"
              >
                {Object.keys(CATEGORY_ICONS_MAP)
                  .filter((c) => c !== "الكل")
                  .map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      className="bg-slate-900 text-white"
                    >
                      {cat}
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${content.trim() ? "bg-gradient-to-r from-accent to-orange-500 text-white shadow-lg shadow-accent/25 hover:scale-105 active:scale-95" : "bg-white/5 text-gray-500 cursor-not-allowed"}`}
            >
              <span>نشر الآن</span>
              <Icons.Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
