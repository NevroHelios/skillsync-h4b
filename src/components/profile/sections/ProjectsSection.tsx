import React, { useState } from 'react';
import { FaProjectDiagram, FaGithub, FaStar, FaCodeBranch, FaHistory, FaPlus, FaReply, FaTrash } from "react-icons/fa";
import { Project } from "@/components/profile/types";
import { Session } from "next-auth"; // Import Session type
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Define types locally or import
interface GitHubRepo {
  name: string; html_url: string; stargazers_count: number; forks_count: number; updated_at: string; description: string | null; fork: boolean; full_name?: string;
}
interface Comment {
  _id: string; user: string; text: string; date: string; parentId: string | null; userEmail?: string; // Add userEmail if needed for avatar logic
}
interface ProjectInteractions {
  [projectName: string]: { likes: number; dislikes: number; userLike: "like" | "dislike" | null; comments: Comment[]; };
}

interface ProjectsSectionProps {
  projects: Project[];
  githubRepos: GitHubRepo[];
  projectInteractions: ProjectInteractions;
  session: Session | null;
  user: any; // Type for the profile owner's data
  handleProjectLike: (projectName: string, action: "like" | "dislike") => Promise<void>;
  handleProjectComment: (projectName: string, comment: string, parentId: string | null) => Promise<void>;
  renderComments: (projectId: string, comments: Comment[], parentId?: string | null, level?: number) => React.ReactNode;
  commentInputs: Record<string, string>;
  setCommentInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleProjectDelete?: (projectName: string) => Promise<void>;
}

// Helper to check if a link is a GitHub repo
const getGithubRepoFromLink = (link: string) => {
  const match = link.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/);
  if (match) return { owner: match[1], repo: match[2] };
  return null;
};

// Enhanced helper function for avatar URLs with better fallbacks
const getAvatarUrl = (url: string | null | undefined): string => {
  if (!url || url.includes("null") || url.includes("undefined")) {
    // Use a public path that's more likely to exist
    return "/default-avatar.png";
  }
  return url;
};

// Inline SVG as a base64 URL for default avatar - will never 404
const DEFAULT_AVATAR_SVG = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6B7280"><path d="M12 12a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6zm9 11a1 1 0 01-2 0v-2a3 3 0 00-3-3H8a3 3 0 00-3 3v2a1 1 0 01-2 0v-2a5 5 0 015-5h8a5 5 0 015 5v2z"/></svg>`).toString('base64')}`;

// Add a utility function to format dates in a user-friendly way
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return diffMinutes === 0 ? 'Just now' : `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
  if (diffDays < 30) {
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString();
};

// Custom comment component with inline reply functionality
const CommentCard = ({ 
  comment, 
  projectId, 
  comments, 
  renderComments,
  session,
  onReply,
  submittingReply,
  handleSubmitReply
}: { 
  comment: Comment, 
  projectId: string, 
  comments: Comment[],
  renderComments: (projectId: string, comments: Comment[], parentId?: string | null, level?: number) => React.ReactNode,
  session: Session | null,
  onReply: (commentId: string | null) => void,
  submittingReply: boolean,
  handleSubmitReply: (commentId: string, text: string) => Promise<void>
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  
  // Handle showing the reply form
  const startReply = () => {
    setIsReplying(true);
    onReply(comment._id);
  };
  
  // Handle canceling the reply
  const cancelReply = () => {
    setIsReplying(false);
    setReplyText("");
    onReply(null);
  };
  
  // Handle submitting the reply
  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    try {
      await handleSubmitReply(comment._id, replyText);
      setReplyText("");
      setIsReplying(false);
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };
  
  return (
    <div className="bg-slate-800/40 border border-gray-700/30 rounded-xl p-4 mb-3 shadow-md hover:bg-slate-800/60 hover:border-gray-600/40 transition-all duration-200">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-500/40 shadow-sm bg-gray-700/70 flex items-center justify-center">
          <img 
            src={getAvatarUrl(comment.userEmail)}
            alt={comment.user}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_AVATAR_SVG;
            }}
          />
        </div>
        <div>
          <div className="text-blue-300 font-medium">{comment.user}</div>
          <div className="text-xs text-gray-400 italic">{formatDate(comment.date)}</div>
        </div>
      </div>
      
      <p className="text-gray-200 ml-11 mb-2">{comment.text}</p>
      
      {/* Reply button or inline reply form */}
      {session && !isReplying ? (
        <div className="flex justify-end">
          <button 
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/30 px-2 py-1 rounded-full border border-blue-500/30 transition-all duration-200"
            onClick={startReply}
          >
            <FaReply className="text-xs" /> 
            <span>Reply</span>
          </button>
        </div>
      ) : session && isReplying ? (
        <div className="mt-3 mb-2 ml-8 border-l-2 pl-3 border-blue-500/30">
          <div className="text-sm text-blue-400 mb-2 flex items-center justify-between">
            <span>Replying to {comment.user}</span>
            <button 
              onClick={cancelReply}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
          <form 
            className="flex gap-2 items-center bg-gray-800/70 rounded-full p-1.5 pl-2 border border-gray-700/50 shadow-inner transition-all duration-300"
            onSubmit={submitReply}
          >
            <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden border border-blue-500/30 bg-gray-700/70 flex items-center justify-center">
              <img 
                src={getAvatarUrl(session?.user?.image)}
                alt={session?.user?.name || 'User'}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR_SVG; }}
              />
            </div>
            <input 
              type="text"
              className="flex-1 bg-transparent border-0 text-gray-200 placeholder:text-gray-500 focus:ring-0 py-1.5 px-1 text-sm"
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={submittingReply}
              autoFocus
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-1.5 px-3 rounded-full text-sm transition-all duration-300 hover:shadow-md hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700"
              disabled={!replyText.trim() || submittingReply}
            >
              Reply
            </button>
          </form>
        </div>
      ) : null}
      
      {/* Recursive rendering of child comments */}
      <div className="mt-3 pl-6 border-l-2 border-blue-500/30">
        {comments
          .filter(c => c.parentId === comment._id)
          .map(childComment => (
            <CommentCard 
              key={childComment._id} 
              comment={childComment} 
              projectId={projectId} 
              comments={comments} 
              renderComments={renderComments}
              session={session}
              onReply={onReply}
              submittingReply={submittingReply}
              handleSubmitReply={handleSubmitReply}
            />
          ))}
      </div>
    </div>
  );
};

const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects, githubRepos, projectInteractions, session, user,
  handleProjectLike, handleProjectComment, renderComments,
  commentInputs, setCommentInputs, handleProjectDelete
}) => {
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const getRepoDataForProject = (p: Project) => {
    const githubInfo = getGithubRepoFromLink(p.link || "");
    if (!githubInfo || !Array.isArray(githubRepos)) return null;
    return githubRepos.find(r =>
      r.full_name && r.full_name.toLowerCase() === `${githubInfo.owner}/${githubInfo.repo}`.toLowerCase()
    );
  };

  const handleSubmitReply = async (commentId: string, text: string, projectName: string) => {
    if (!text.trim() || !commentId) return;
    
    try {
      setSubmittingComment(projectName);
      await handleProjectComment(projectName, text, commentId);
      setActiveReplyCommentId(null);
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setSubmittingComment(null);
    }
  };

  const tailwindCommentRenderer = (projectId: string, comments: Comment[]) => {
    const rootComments = comments.filter(c => !c.parentId);
    
    return (
      <div className="space-y-4">
        {rootComments.map(comment => (
          <CommentCard
            key={comment._id}
            comment={comment}
            projectId={projectId}
            comments={comments}
            renderComments={renderComments}
            session={session}
            onReply={setActiveReplyCommentId}
            submittingReply={submittingComment === projectId}
            handleSubmitReply={(commentId, text) => handleSubmitReply(commentId, text, projectId)}
          />
        ))}
      </div>
    );
  };

  // Slider settings for react-slick
  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 2,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 1, slidesToScroll: 1 } }
    ]
  };

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-0 section-container">
      <div
        className="section-header flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 rounded-xl mb-6"
        style={{
          background: "linear-gradient(90deg, rgba(36,37,46,0.95) 0%, rgba(44,48,66,0.85) 100%)",
          boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)"
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold text-gray-100 tracking-tight">
          <FaProjectDiagram size={20} className="sm:size-6" /> <span>Projects</span>
        </div>
      </div>
      
      {projectToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl animate-fadeIn">
            <h3 className="text-xl text-red-300 font-semibold mb-2">Delete Project</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete <span className="text-white font-semibold">{projectToDelete}</span>? 
              This will also delete all associated comments and likes.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!handleProjectDelete) return;
                  setIsDeleting(true);
                  await handleProjectDelete(projectToDelete!);
                  setProjectToDelete(null);
                  setIsDeleting(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : (<><FaTrash size={14}/> Delete Project</>)}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Slider {...sliderSettings}>
        {projects.map((p, i) => {
          const repoData = getRepoDataForProject(p);
          const interaction = projectInteractions[p.name] || { likes: 0, dislikes: 0, userLike: null, comments: [] };
          const commentInput = commentInputs[p.name] || "";
          return (
            <div key={i} className="px-2 sm:px-3 py-2">
              <div
                className="bg-gradient-to-br from-gray-900/80 to-gray-800/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-gray-700/40 hover:border-blue-500/60 transition-all duration-200 flex flex-col justify-between h-full min-h-[250px] sm:min-h-[290px] shadow-xl hover:shadow-2xl group"
                style={{
                  boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10)"
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-semibold text-gray-100 text-xl">{p.name}</span>
                  <div className="flex items-center gap-2">
                    {/* Delete button for owner */}
                    {session?.user?.email === user?.email && handleProjectDelete && (
                      <button
                        onClick={() => setProjectToDelete(p.name)}
                        className="bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 p-2 rounded transition-all duration-200 group"
                        title="Delete project"
                        aria-label="Delete project"
                        style={{ display: "inline-flex", alignItems: "center" }}
                      >
                        <FaTrash size={14} className="group-hover:scale-110 transition-transform" />
                        <span className="ml-1 text-xs hidden sm:inline">Delete</span>
                      </button>
                    )}
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm font-medium flex-shrink-0">
                        View Project
                      </a>
                    )}
                  </div>
                </div>

                {p.description && (
                  <p className="text-gray-400 text-base mb-5">{p.description}</p>
                )}

                <div className="flex flex-wrap gap-x-5 gap-y-2.5 text-sm mb-5">
                  {p.skills && p.skills.length > 0 && (
                    <div className="w-full">
                      <div className="flex items-center gap-2 text-gray-300 mb-2">
                        <span className="font-medium">Skills:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {p.skills.map((skill, skillIdx) => (
                          <span 
                            key={skillIdx} 
                            className="px-3 py-1.5 bg-gradient-to-br from-indigo-900/40 to-blue-900/30 text-blue-200 rounded-md border border-blue-500/20 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all duration-200 text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {p.experience && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="font-medium">Experience:</span>
                      <span className="bg-gray-700/80 px-2.5 py-1 rounded-sm text-gray-200">{p.experience}</span>
                    </div>
                  )}
                </div>

                {repoData && (
                  <div className="bg-gray-950 rounded-md p-4 border border-gray-700/50 my-5">
                    <div className="flex justify-between items-center mb-2">
                      <a href={repoData.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-medium block truncate flex-1 mr-2 text-base" title={repoData.name}>
                        <FaGithub className="inline mr-1.5" /> {repoData.name}
                      </a>
                      {repoData.fork && <span className="text-xs text-gray-300 bg-indigo-900/30 px-2 py-0.5 rounded-full border border-indigo-600/30">Fork</span>}
                    </div>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {repoData.description || <span className="italic">No description.</span>}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center bg-yellow-900/20 text-yellow-300 px-3 py-1.5 rounded-full">
                        <FaStar className="mr-1.5" />{repoData.stargazers_count}
                      </span>
                      <span className="flex items-center bg-blue-900/20 text-blue-300 px-3 py-1.5 rounded-full">
                        <FaCodeBranch className="mr-1.5" />{repoData.forks_count}
                      </span>
                      <span className="flex items-center bg-gray-800/50 text-gray-300 px-3 py-1.5 rounded-full">
                        <FaHistory className="mr-1.5" />Updated: {formatDate(repoData.updated_at)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-5 mt-6 pt-5 border-t border-gray-700/40">
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    {session?.user?.email === user?.email ? (
                      <div className="flex flex-col items-center sm:items-start">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 text-gray-400 border border-gray-700 opacity-70 cursor-not-allowed">
                            <span className="text-xl">👍</span> 
                            <span className="font-medium">{interaction.likes}</span>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 text-gray-400 border border-gray-700 opacity-70 cursor-not-allowed">
                            <span className="text-xl">👎</span>
                            <span className="font-medium">{interaction.dislikes}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 italic">You cannot rate your own projects</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          className={`group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 
                          ${interaction.userLike === "like" 
                            ? "bg-gradient-to-r from-green-600/40 to-emerald-600/30 text-green-300 shadow-lg shadow-green-900/30 border border-green-500/40" 
                            : "bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-gray-700 hover:border-green-500/30 hover:shadow-md hover:shadow-green-900/10"}`}
                          onClick={() => handleProjectLike(p.name, "like")}
                          aria-label="Like project"
                        >
                          <span className="text-xl transition-transform duration-300 group-hover:scale-125 group-active:scale-90">👍</span> 
                          <span className="font-medium">{interaction.likes}</span>
                        </button>
                        <button
                          className={`group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105
                          ${interaction.userLike === "dislike" 
                            ? "bg-gradient-to-r from-red-600/40 to-rose-600/30 text-red-300 shadow-lg shadow-red-900/30 border border-red-500/40" 
                            : "bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-gray-700 hover:border-red-500/30 hover:shadow-md hover:shadow-red-900/10"}`}
                          onClick={() => handleProjectLike(p.name, "dislike")}
                          aria-label="Dislike project"
                        >
                          <span className="text-xl transition-transform duration-300 group-hover:scale-125 group-active:scale-90">👎</span>
                          <span className="font-medium">{interaction.dislikes}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="w-full">
                    <details className="group">
                      <summary className="flex items-center gap-2 text-base font-medium text-gray-300 cursor-pointer hover:text-blue-300 transition-colors duration-200 list-none rounded-md">
                        <span className="group-open:hidden bg-blue-900/30 w-7 h-7 rounded-full flex items-center justify-center text-blue-300 shadow-inner shadow-blue-500/10 transition-transform group-hover:scale-110 duration-200">+</span>
                        <span className="hidden group-open:flex bg-blue-900/30 w-7 h-7 rounded-full items-center justify-center text-blue-300 shadow-inner shadow-blue-500/10 transition-transform group-hover:scale-110 duration-200">−</span>
                        <span className="group-hover:underline">
                          {interaction.comments.length > 0 
                            ? <span>View <span className="text-blue-400 font-medium">{interaction.comments.length}</span> Comments</span> 
                            : 'Add Comment'}
                        </span>
                      </summary>
                      <div className="mt-5 pt-5 border-t border-gray-700/30 animate-fadeIn">
                        <div className="max-h-80 overflow-y-auto pr-2 mb-5 custom-scrollbar">
                          {interaction.comments.length > 0
                            ? <div className="bg-gradient-to-b from-gray-900/50 to-gray-950/50 p-4 rounded-xl">
                                {tailwindCommentRenderer(p.name, interaction.comments)}
                              </div>
                            : <div className="flex flex-col items-center justify-center py-8 bg-gray-800/20 rounded-lg border border-gray-700/30">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-gray-500 italic">No comments yet. Be the first to share your thoughts!</p>
                              </div>
                          }
                        </div>
                        {!activeReplyCommentId && (
                          <form
                            className={`flex gap-3 items-center bg-gray-800/50 rounded-full p-1.5 pl-2 border border-gray-700/50 shadow-inner 
                              focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/30 transition-all duration-300
                              ${submittingComment === p.name ? 'animate-pulse' : ''}`}
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (!commentInput.trim()) return;
                              setSubmittingComment(p.name);
                              try {
                                await handleProjectComment(p.name, commentInput, null);
                              } catch (err) {
                                console.error('Error posting comment:', err);
                              } finally {
                                setTimeout(() => setSubmittingComment(null), 500);
                              }
                            }}
                          >
                            <div className="relative group w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-gray-700/70 flex items-center justify-center border border-gray-600/30 shadow-sm hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300">
                              {session?.user ? (
                                <>
                                  <img 
                                    src={getAvatarUrl(session.user.image)}
                                    alt={session.user.name || 'User'}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => {
                                      e.currentTarget.src = DEFAULT_AVATAR_SVG;
                                    }}
                                  />
                                  {session.user.name && (
                                    <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-gray-700/50">
                                      {session.user.name}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                  <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-gray-700/50">
                                    Sign in to comment
                                  </span>
                                </>
                              )}
                            </div>
                            
                            <input
                              type="text"
                              className="flex-1 bg-transparent border-0 text-gray-200 placeholder:text-gray-500 focus:ring-0 py-2 px-1"
                              placeholder={session?.user?.email ? "Add a comment..." : "Sign in to comment"}
                              value={commentInput}
                              onChange={e => setCommentInputs(inputs => ({ ...inputs, [p.name]: e.target.value }))}
                              disabled={!session?.user?.email || submittingComment === p.name}
                            />
                            <button 
                              type="submit" 
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-2.5 px-5 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400 disabled:hover:shadow-none disabled:hover:scale-100"
                              disabled={!commentInput.trim() || !session?.user?.email || submittingComment === p.name}
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {submittingComment === p.name ? 'Posting...' : 'Post'}
                                {submittingComment !== p.name && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                  </svg>
                                )}
                              </span>
                            </button>
                          </form>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              </div>
              {/* Divider for mobile */}
              <div className="block md:hidden h-4" />
            </div>
          );
        })}
      </Slider>
    </div>
  );
};

export default ProjectsSection;
