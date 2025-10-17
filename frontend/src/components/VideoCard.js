import React, { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getVideoType,
  getYouTubeVideoId,
  getYouTubeThumbnail,
} from "../utils/videoUtils";
import { useStarred } from "../contexts/StarredContext";
import api from "../utils/api"; // Import the configured api instance
import "./VideoCard.css";

const VideoCard = React.memo(({ video }) => {
  // Handle case where video is undefined or null
  if (!video) {
    return null; // Don't render anything if video is not provided
  }

  const [isHovered, setIsHovered] = useState(false);
  const { isStarred, toggleStarred } = useStarred();

  const getThumbnail = useCallback(() => {
    // For file uploads with thumbnail files, use the thumbnail file URL
    if (video.thumbnailFileUrl) {
      // Construct the full URL using the API base URL
      const baseURL = api.defaults.baseURL || '';
      return `${baseURL}${video.thumbnailFileUrl}`;
    }
    
    // For URL uploads or videos with thumbnail URLs, use the thumbnail property
    if (video.thumbnail) {
      return video.thumbnail;
    }

    // Auto-generate thumbnail for YouTube videos if not provided
    const videoType = getVideoType(video.url);
    if (videoType === "youtube") {
      const videoId = getYouTubeVideoId(video.url);
      if (videoId) {
        return getYouTubeThumbnail(videoId);
      }
    }

    return "/placeholder-thumbnail.jpg";
  }, [video.thumbnail, video.thumbnailFileUrl, video.url]);

  const getVideoPreview = useCallback(() => {
    const videoType = getVideoType(video.url);
    if (videoType === "youtube") {
      const videoId = getYouTubeVideoId(video.url);
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}`;
    }
    return null;
  }, [video.url]);

  const formatViews = useCallback((views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views?.toString() || "0";
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  }, []);

  const handleStarClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleStarred(video);
  }, [toggleStarred, video]);

  const thumbnailUrl = useMemo(() => getThumbnail(), [getThumbnail]);
  const videoPreviewUrl = useMemo(() => getVideoPreview(), [getVideoPreview]);
  const viewsFormatted = useMemo(() => formatViews(video.views), [formatViews, video.views]);
  const dateFormatted = useMemo(() => video.createdAt ? formatDate(video.createdAt) : null, [formatDate, video.createdAt]);

  return (
    <div
      className={`video-card floating-element ${isHovered ? "hovered" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/video/${video.id}`} className="video-link">
        <div className="video-thumbnail">
          {/* Star icon for marking favorites */}
          <button
            className={`star-button ${isStarred(video.id) ? "starred" : ""}`}
            onClick={handleStarClick}
            title={
              isStarred(video.id)
                ? "Remove from watch later"
                : "Add to watch later"
            }
          >
            ⭐
          </button>

          {isHovered && videoPreviewUrl ? (
            <iframe
              src={videoPreviewUrl}
              className="video-preview"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={`Preview of ${video.title}`}
            />
          ) : (
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="thumbnail-image"
              onError={(e) => {
                e.target.src = "/placeholder-thumbnail.jpg";
              }}
            />
          )}

          {/* Hover Overlay */}
          {isHovered && (
            <div className="video-preview-overlay">
              <div className="play-button">
                <span className="play-icon">▶️</span>
                <span className="play-text">Watch Now</span>
              </div>
            </div>
          )}
        </div>
        <div className="video-info">
          <h3 className="video-title">{video.title || "Untitled Video"}</h3>
          <div className="video-meta">
            <span className="video-author">
              {video.User?.username || "Unknown User"}
            </span>
            <div className="video-stats">
              <span>{viewsFormatted} views</span>
              {dateFormatted && (
                <>
                  <span className="dot">•</span>
                  <span>{dateFormatted}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
});

export default VideoCard;