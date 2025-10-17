import React from 'react';
import { getVideoType, getYouTubeVideoId, getVimeoVideoId, getEmbedUrl } from '../utils/videoUtils';

const VideoPlayer = ({ video, className = '', autoPlay = true }) => {
  // Check if video object exists
  if (!video) {
    return (
      <div className={`video-player-error ${className}`}>
        <p>Video data not available.</p>
      </div>
    );
  }
  
  // Check if this is a locally stored video file
  const isLocalVideo = video.uploadType === 'file';
  
  if (isLocalVideo) {
    // For locally stored videos, we use the video file endpoint
    // Use the videoFileUrl if available, otherwise construct it
    const localVideoUrl = video.videoFileUrl || (video.id ? `/api/v1/videos/${video.id}/file` : '');
    
    // Check if we have a valid URL
    if (!localVideoUrl) {
      return (
        <div className={`video-player-error ${className}`}>
          <p>Video file not available.</p>
        </div>
      );
    }
    
    return (
      <video 
        controls 
        autoPlay={autoPlay}
        className={`video-player direct-player ${className}`}
        poster={video.thumbnail || ''}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px'
        }}
      >
        <source src={localVideoUrl} type={video.mimeType || "video/mp4"} />
        Your browser does not support the video tag.
      </video>
    );
  }
  
  // For URL-based videos, use the existing logic
  // Check if we have a valid URL
  if (!video.url) {
    return (
      <div className={`video-player-error ${className}`}>
        <p>Video URL not available.</p>
      </div>
    );
  }
  
  const videoType = getVideoType(video.url);
  const embedUrl = getEmbedUrl(video.url);

  if (!embedUrl) {
    return (
      <div className={`video-player-error ${className}`}>
        <p>Unable to play this video. Invalid video URL format.</p>
      </div>
    );
  }

  switch (videoType) {
    case 'youtube':
      const youtubeId = getYouTubeVideoId(video.url);
      const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeId}?${autoPlay ? 'autoplay=1&' : ''}rel=0&modestbranding=1`;
      
      return (
        <iframe
          className={`video-player youtube-player ${className}`}
          src={youtubeEmbedUrl}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            width: '100%',
            height: '100%',
            minHeight: '400px'
          }}
        />
      );

    case 'vimeo':
      const vimeoId = getVimeoVideoId(video.url);
      const vimeoEmbedUrl = `https://player.vimeo.com/video/${vimeoId}?${autoPlay ? 'autoplay=1&' : ''}color=ffffff&title=0&byline=0&portrait=0`;
      
      return (
        <iframe
          className={`video-player vimeo-player ${className}`}
          src={vimeoEmbedUrl}
          title={video.title}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{
            width: '100%',
            height: '100%',
            minHeight: '400px'
          }}
        />
      );

    case 'direct':
    default:
      return (
        <video 
          controls 
          autoPlay={autoPlay}
          className={`video-player direct-player ${className}`}
          poster={video.thumbnail || ''}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '400px'
          }}
        >
          <source src={video.url} type="video/mp4" />
          <source src={video.url} type="video/webm" />
          <source src={video.url} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      );
  }
};

export default VideoPlayer;