import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useStarred } from "../contexts/StarredContext";
import api from "../utils/api"; // Import the configured api instance
import VideoPlayer from "../components/VideoPlayer";
import "./VideoWatch.css";

const VideoWatch = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { isStarred, toggleStarred } = useStarred();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchVideo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/videos/${id}`);
      setVideo(response.data.data);

      // Record a view only if user is authenticated and hasn't viewed yet
      if (isAuthenticated && !response.data.data.isViewed) {
        try {
          await api.get(`/videos/${id}/view`);
        } catch (viewError) {
          // Silently handle view recording errors
        }
      }
    } catch (error) {
      setError("Failed to load video");
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      alert("Please login to like videos");
      return;
    }
    try {
      await api.get(`/videos/${id}/like`);

      // Update like state without refetching entire video
      setVideo((prevVideo) => {
        const wasLiked = prevVideo.isLiked;
        const wasDisliked = prevVideo.isDisliked;

        return {
          ...prevVideo,
          isLiked: !wasLiked,
          isDisliked: false, // Remove dislike if it was disliked
          likesCount: wasLiked
            ? prevVideo.likesCount - 1
            : prevVideo.likesCount + 1,
          dislikesCount: wasDisliked
            ? prevVideo.dislikesCount - 1
            : prevVideo.dislikesCount,
        };
      });
    } catch (error) {
      // Silently handle error
    }
  }, [id, isAuthenticated]);

  const handleDislike = useCallback(async () => {
    if (!isAuthenticated) {
      alert("Please login to dislike videos");
      return;
    }
    try {
      await api.get(`/videos/${id}/dislike`);

      // Update dislike state without refetching entire video
      setVideo((prevVideo) => {
        const wasLiked = prevVideo.isLiked;
        const wasDisliked = prevVideo.isDisliked;

        return {
          ...prevVideo,
          isLiked: false, // Remove like if it was liked
          isDisliked: !wasDisliked,
          likesCount: wasLiked
            ? prevVideo.likesCount - 1
            : prevVideo.likesCount,
          dislikesCount: wasDisliked
            ? prevVideo.dislikesCount - 1
            : prevVideo.dislikesCount + 1,
        };
      });
    } catch (error) {
      // Silently handle error
    }
  }, [id, isAuthenticated]);

  const handleCommentSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!isAuthenticated) {
        alert("Please login to comment");
        return;
      }
      if (!newComment.trim()) return;

      setSubmittingComment(true);
      try {
        const response = await api.post(`/videos/${id}/comment`, {
          text: newComment,
        });
        const newCommentData = response.data.data;

        // Update only comments without refetching entire video
        setVideo((prevVideo) => ({
          ...prevVideo,
          comments: [newCommentData, ...(prevVideo.comments || [])],
          commentsCount: (prevVideo.commentsCount || 0) + 1,
        }));

        setNewComment("");
      } catch (error) {
        // Silently handle error
      } finally {
        setSubmittingComment(false);
      }
    },
    [id, isAuthenticated, newComment]
  );

  const handleStarClick = useCallback(() => {
    if (video) {
      toggleStarred(video);
    }
  }, [video, toggleStarred]);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const formatViews = useCallback((views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views?.toString() || "0";
  }, []);

  const getVideoSource = useCallback(() => {
    // Check if video exists
    if (!video) return '';
    
    // For file uploads, use the video file URL
    if (video.videoFileUrl) {
      return `${api.defaults.baseURL}${video.videoFileUrl}`;
    }
    // For URL uploads, use the url property
    return video.url || '';
  }, [video]);

  const getThumbnail = useCallback(() => {
    // Check if video exists
    if (!video) return '';
    
    // For file uploads with thumbnail files, use the thumbnail file URL
    if (video.thumbnailFileUrl) {
      return `${api.defaults.baseURL}${video.thumbnailFileUrl}`;
    }
    // For URL uploads or videos with thumbnail URLs, use the thumbnail property
    return video.thumbnail || '';
  }, [video]);

  const videoSource = useMemo(() => getVideoSource(), [getVideoSource]);
  const thumbnailUrl = useMemo(() => getThumbnail(), [getThumbnail]);

  const errorMessage = useMemo(() => {
    if (loading) return <div className="loading">Loading video...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!video) return <div className="error">Video not found</div>;
    return null;
  }, [loading, error, video]);

  if (errorMessage) return errorMessage;

  return (
    <div className="video-watch">
      <div className="video-player-container">
        <VideoPlayer 
          video={{ ...video, url: videoSource, thumbnail: thumbnailUrl }} 
          autoPlay={true} 
          className="video-player" 
        />
      </div>

      <div className="video-content">
        <div className="video-main">
          <h1 className="video-title">{video.title}</h1>

          <div className="video-stats">
            <span>
              {formatViews(video.views)} views • {formatDate(video.createdAt)}
            </span>
            <div className="video-actions">
              <button
                className={`action-btn ${video.isLiked ? "active" : ""}`}
                onClick={handleLike}
              >
                👍 {video.likesCount}
              </button>
              <button
                className={`action-btn ${video.isDisliked ? "active" : ""}`}
                onClick={handleDislike}
              >
                👎 {video.dislikesCount}
              </button>
              <button
                className={`action-btn star-action ${
                  isStarred(video.id) ? "starred" : ""
                }`}
                onClick={handleStarClick}
                title={
                  isStarred(video.id)
                    ? "Remove from watch later"
                    : "Add to watch later"
                }
              >
                ⭐
              </button>
            </div>
          </div>

          {video.description && (
            <div className="video-description">
              <p>{video.description}</p>
            </div>
          )}

          <div className="comments-section">
            <h3>{video.commentsCount} Comments</h3>

            <form onSubmit={handleCommentSubmit} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  isAuthenticated
                    ? "Add a comment..."
                    : "Please login to add comments"
                }
                rows="3"
                disabled={!isAuthenticated}
              />
              <button
                type="submit"
                disabled={
                  submittingComment || !newComment.trim() || !isAuthenticated
                }
                className="comment-submit"
              >
                {!isAuthenticated
                  ? "Login to Comment"
                  : submittingComment
                  ? "Adding..."
                  : "Comment"}
              </button>
            </form>

            <div className="comments-list">
              {video.comments?.map((comment) => (
                <div key={comment.id} className="comment">
                  <div className="comment-avatar">
                    {comment.User?.avatar ? (
                      <img
                        src={comment.User.avatar}
                        alt={comment.User.username}
                      />
                    ) : (
                      <div className="default-avatar">
                        {comment.User?.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">
                        {comment.User?.username}
                      </span>
                      <span className="comment-date">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VideoWatch);
