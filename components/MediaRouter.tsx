import React from 'react';
import { Idea } from '../types';
import { HomeIdeaListItem } from './HomeIdeaListItem';
import { ProfileMedia } from './ProfileMedia';
// import { StoryMedia } from './StoryMedia'; // handled inside StoryPage for now, but we can export it

interface Props {
  idea: Idea;
  context: 'feed' | 'profile' | 'story';
  // Additional props for FeedMedia
  currentUser?: any;
  users?: any[];
  follows?: any[];
  comments?: any[];
  expandedIdeas?: Set<string>;
  toggleExpand?: (e: React.MouseEvent, id: string) => void;
  handleFollow?: (e: React.MouseEvent, id: string) => void;
  handleSelectIdea?: (id: string) => void;
  handleViewIdea?: (idea: Idea) => void;
  handleDeleteIdea?: (id: string, authorId: string) => void;
  handleDeleteComment?: (commentId: string, commentUserId: string) => void;
  handleUpdateIdea?: (idea: Idea) => void;
  handlePinIdea?: (idea: Idea) => void;
  playingVideoId?: string | null;
  setPlayingVideoId?: (id: string | null) => void;
  handleLike?: (e: React.MouseEvent, idea: Idea) => void;
  isOwnProfile?: boolean;
}

export const MediaRouter: React.FC<Props> = (props) => {
  const { context, idea } = props;

  // We map the idea to the thought structure conceptually, but pass idea to the components
  
  if (context === 'story') {
    // StoryMedia is natively integrated into StoryPage due to Complex Gestures, 
    // but the router pattern represents the separation.
    return null; 
  }

  if (context === 'profile') {
    const canViewStats = props.currentUser && (props.currentUser.id === idea.authorId || props.currentUser.role === 'admin' || props.currentUser.role === 'super_admin');
    return (
      <ProfileMedia 
        thought={idea} 
        canViewStats={canViewStats}
        onClick={() => props.handleSelectIdea && props.handleSelectIdea(idea.id)} 
      />
    );
  }

  // default to feed
  return (
    <HomeIdeaListItem 
      idea={idea}
      currentUser={props.currentUser || null}
      users={props.users || []}
      follows={props.follows || []}
      comments={props.comments || []}
      expandedIdeas={props.expandedIdeas}
      toggleExpand={props.toggleExpand}
      handleFollow={props.handleFollow!}
      handleSelectIdea={props.handleSelectIdea}
      handleViewIdea={props.handleViewIdea}
      handleDeleteIdea={props.handleDeleteIdea}
      handleDeleteComment={props.handleDeleteComment}
      handleUpdateIdea={props.handleUpdateIdea}
      handlePinIdea={props.handlePinIdea}
      playingVideoId={props.playingVideoId || null}
      setPlayingVideoId={props.setPlayingVideoId!}
      handleLike={props.handleLike!}
      isOwnProfile={props.isOwnProfile}
    />
  );
};
