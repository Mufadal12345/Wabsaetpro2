import React, { useMemo, useCallback } from "react";
import { useFeedActions } from "../hooks/useFeedActions";
import { Icons } from "../components/Icons";
import { PostSkeleton } from "../components/Skeletons";
import { MediaRouter } from "../components/MediaRouter";
import { StoriesBar } from "../components/home/StoriesBar";
import { useIdeas } from "../hooks/useAppQueries";
import { Virtuoso } from "react-virtuoso";
import { Idea } from "../types";

export const Home: React.FC = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useIdeas(20);

  const {
    expandedIdeas,
    playingVideoId,
    setPlayingVideoId,
    handleLike,
    handleDeleteIdea,
    handleDeleteComment,
    handleFollow,
    toggleExpand,
    handleViewIdea,
    handleUpdateIdea,
    currentUser,
    users,
    follows,
    comments,
  } = useFeedActions();

  const rawIdeas = useMemo(() => {
    const allIdeas = data?.pages.flatMap((page) => page.ideas) ?? [];
    
    // Minimalist Text Feed: Only texts without images and links
    return allIdeas;
  }, [data]);

  const renderItem = useCallback((_index: number, idea: Idea) => (
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
  ), [currentUser, users, follows, comments, expandedIdeas, playingVideoId, toggleExpand, handleFollow, handleDeleteIdea, handleDeleteComment, handleUpdateIdea, handleLike]);

  return (
    <div className="font-tajawal bg-black selection:bg-accent/30 !scroll-smooth overscroll-y-contain will-change-transform transform-gpu" dir="rtl">
      <div className="max-w-6xl mx-auto px-1 sm:px-2">
        {/* Sticky Stories Bar */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 min-h-[120px] -mx-1 sm:-mx-2 px-1 sm:px-2">
          <StoriesBar />
        </div>

        <div className="pt-2">
          {isLoading && rawIdeas.length === 0 ? (
            <div className="space-y-6 pt-4 px-4">
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : (
            <Virtuoso
              className="will-change-transform transform-gpu overscroll-y-contain !scroll-smooth"
              useWindowScroll
              data={rawIdeas}
              endReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              increaseViewportBy={1500}
              scrollSeekConfiguration={{
                enter: v => v > 2000,
                exit: v => v < 500
              }}
              itemContent={renderItem}
              components={{
                Footer: () => (
                  <div className="h-40 w-full flex flex-col items-center justify-center border-t border-white/5 mt-10">
                    {isFetchingNextPage ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-bold text-gray-500">نستكشف لك المزيد...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <Icons.Zap className="w-6 h-6 text-accent" />
                        <span className="text-xs font-bold">لقد وصلت لنهاية الأفكار حالياً</span>
                      </div>
                    )}
                  </div>
                )
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

