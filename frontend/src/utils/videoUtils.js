// Video utility functions for handling different video sources

export const getVideoType = (url) => {
  if (!url) return 'unknown';
  
  // YouTube patterns
  if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
    return 'youtube';
  }
  
  // Vimeo patterns
  if (url.includes('vimeo.com/')) {
    return 'vimeo';
  }
  
  // Direct video file patterns
  if (url.match(/\.(mp4|webm|ogg|avi|mov)$/i)) {
    return 'direct';
  }
  
  // Default to direct if no specific pattern is matched
  return 'direct';
};

export const getYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const getVimeoVideoId = (url) => {
  const regExp = /vimeo\.com\/(?:.*\/)?(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

export const getYouTubeEmbedUrl = (videoId) => {
  return `https://www.youtube.com/embed/${videoId}`;
};

export const getVimeoEmbedUrl = (videoId) => {
  return `https://player.vimeo.com/video/${videoId}`;
};

export const getYouTubeThumbnail = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

export const getVimeoThumbnail = async (videoId) => {
  try {
    const response = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);
    const data = await response.json();
    return data[0]?.thumbnail_large || '';
  } catch (error) {
    console.error('Error fetching Vimeo thumbnail:', error);
    return '';
  }
};

export const validateVideoUrl = (url) => {
  const videoType = getVideoType(url);
  
  switch (videoType) {
    case 'youtube':
      return !!getYouTubeVideoId(url);
    case 'vimeo':
      return !!getVimeoVideoId(url);
    case 'direct':
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    default:
      return false;
  }
};

export const getEmbedUrl = (url) => {
  const videoType = getVideoType(url);
  
  switch (videoType) {
    case 'youtube':
      const youtubeId = getYouTubeVideoId(url);
      return youtubeId ? getYouTubeEmbedUrl(youtubeId) : null;
    case 'vimeo':
      const vimeoId = getVimeoVideoId(url);
      return vimeoId ? getVimeoEmbedUrl(vimeoId) : null;
    case 'direct':
      return url;
    default:
      return null;
  }
};