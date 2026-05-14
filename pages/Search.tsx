import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { useData } from '../contexts/DataContext';
import { MediaRouter } from "../components/MediaRouter";
import { useAuth } from '../contexts/AuthContext';
import { useFeedActions } from '../hooks/useFeedActions';

export const Search: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const { ideas, users, comments, follows } = useData();
    const { currentUser } = useAuth();
    
    const {
      expandedIdeas,
      playingVideoId,
      setPlayingVideoId,
      handleLike,
      handleFollow,
      toggleExpand,
    } = useFeedActions();
    
    // Simplistic search for ideas
    const searchResults = searchTerm.trim() 
        ? ideas.filter(i => 
            !i.deleted && (
              (i.title && i.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (i.content && i.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (i.hashtags && i.hashtags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))) ||
              (i.author && i.author.toLowerCase().includes(searchTerm.toLowerCase()))
            )
          )
        : [];

    return (
        <div className="min-h-screen bg-[#000000] text-white animate-fade-in font-tajawal pt-6 pb-24 px-1 sm:px-2">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex gap-3 items-center mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <Icons.ArrowRight className="w-5 h-5" />
                    </button>
                    <div className="relative flex-1">
                        <Icons.Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="ابحث عن فكرة، مستخدم، أو هاشتاج..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-style w-full pr-12 pl-4 py-3 rounded-2xl text-md bg-white/5 border-white/10 focus:bg-white/10 transition-all font-bold"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    {searchTerm.trim() && searchResults.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            لا توجد نتائج مطابقة لبحثك "{searchTerm}"
                        </div>
                    ) : (
                        searchResults.map(idea => (
                           <div key={idea.id} className="pb-3 pt-1">
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
                                handleSelectIdea={(id) => navigate(`/ideas?ideaId=${id}`)}
                                playingVideoId={playingVideoId}
                                setPlayingVideoId={setPlayingVideoId}
                                handleLike={handleLike}
                                isOwnProfile={idea.authorId === currentUser?.id}
                            />
                           </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
