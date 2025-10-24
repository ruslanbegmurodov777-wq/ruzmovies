import { Op } from "sequelize";
import {
  User,
  Video,
  VideoLike,
  Comment,
  View,
  Subscription,
} from "../sequelize.js";
import asyncHandler from "../middlewares/asyncHandler.js";

// Cache for frequently accessed data
const videoCache = new Map();
const CACHE_TTL = 0; // Disable caching for debugging

export const newVideo = asyncHandler(async (req, res, next) => {
  let videoData = {
    ...req.body,
    userId: req.user.id,
  };

  // Handle file upload if present
  if (req.files && req.files.videoFile) {
    const videoFile = req.files.videoFile[0];
    videoData = {
      ...videoData,
      videoFile: videoFile.buffer,
      fileName: videoFile.originalname,
      fileSize: videoFile.size,
      mimeType: videoFile.mimetype,
      uploadType: 'file',
      url: null,
    };
    
    // For file uploads, thumbnail is optional
    if (!videoData.thumbnail && !videoData.thumbnailFile) {
      videoData.thumbnail = 'https://via.placeholder.com/320x180.png?text=Video+Thumbnail';
    }
  } else {
    videoData.uploadType = 'url';
    
    // For URL uploads, require either a thumbnail URL or a thumbnail file
    const hasThumbUrl = !!videoData.thumbnail;
    const hasThumbFile = !!(req.files && req.files.thumbnailFile && req.files.thumbnailFile[0]);
    if (!hasThumbUrl && !hasThumbFile) {
      return next({
        message: "Provide a thumbnail URL or upload a thumbnail image",
        statusCode: 400,
      });
    }
  }

  // Handle thumbnail file upload if present
  if (req.files && req.files.thumbnailFile) {
    const thumbnailFile = req.files.thumbnailFile[0];
    videoData = {
      ...videoData,
      thumbnailFile: thumbnailFile.buffer,
      thumbnailFileName: thumbnailFile.originalname,
      thumbnailFileSize: thumbnailFile.size,
      thumbnailMimeType: thumbnailFile.mimetype,
    };
    
    // Only set thumbnail to null if we're storing the file
    if (!videoData.thumbnail) {
      videoData.thumbnail = null;
    }
  }

  const video = await Video.create(videoData);
  
  // Clear cache when new video is added
  videoCache.clear();

  res.status(200).json({ success: true, data: video });
});

// New endpoint to serve video files
export const getVideoFile = asyncHandler(async (req, res, next) => {
  const video = await Video.findByPk(req.params.id, {
    attributes: ['videoFile', 'fileName', 'mimeType', 'fileSize', 'uploadType']
  });

  if (!video) {
    return next({
      message: `No video found for ID - ${req.params.id}`,
      statusCode: 404,
    });
  }

  if (video.uploadType !== 'file' || !video.videoFile) {
    return next({
      message: 'Video file not available',
      statusCode: 404,
    });
  }

  // Set appropriate headers
  res.set({
    'Content-Type': video.mimeType || 'video/mp4',
    'Content-Length': video.fileSize,
    'Content-Disposition': `inline; filename="${video.fileName}"`,
    'Accept-Ranges': 'bytes',
  });

  // Handle range requests for video streaming
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : video.fileSize - 1;
    const chunksize = (end - start) + 1;
    
    res.status(206).set({
      'Content-Range': `bytes ${start}-${end}/${video.fileSize}`,
      'Content-Length': chunksize,
    });
    
    const chunk = video.videoFile.slice(start, end + 1);
    res.send(chunk);
  } else {
    res.send(video.videoFile);
  }
});

// New endpoint to serve thumbnail files
export const getThumbnailFile = asyncHandler(async (req, res, next) => {
  const video = await Video.findByPk(req.params.id, {
    attributes: ['thumbnailFile', 'thumbnailFileName', 'thumbnailMimeType', 'thumbnailFileSize', 'thumbnail']
  });

  if (!video) {
    return next({
      message: `No video found for ID - ${req.params.id}`,
      statusCode: 404,
    });
  }

  // Check if thumbnail file exists
  if (video.thumbnailFile) {
    // Serve thumbnail file
    res.set({
      'Content-Type': video.thumbnailMimeType || 'image/jpeg',
      'Content-Length': video.thumbnailFileSize,
      'Content-Disposition': `inline; filename="${video.thumbnailFileName}"`,
    });

    res.send(video.thumbnailFile);
  } else if (video.thumbnail) {
    // Redirect to thumbnail URL if file doesn't exist but URL does
    res.redirect(video.thumbnail);
  } else {
    // Return default thumbnail if neither file nor URL exists
    res.redirect('https://via.placeholder.com/320x180.png?text=Video+Thumbnail');
  }
});

// Helper function to get cached video data
const getCachedVideoData = (videoId) => {
  const cached = videoCache.get(videoId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

// Helper function to set cached video data
const setCachedVideoData = (videoId, data) => {
  videoCache.set(videoId, {
    data,
    timestamp: Date.now()
  });
};

export const getVideo = asyncHandler(async (req, res, next) => {
  try {
    // Check cache first
    const cachedData = getCachedVideoData(req.params.id);
    if (cachedData) {
      // Process cached data to ensure it has the correct URLs
      const video = cachedData;
      
      // For file uploads, provide URLs to access the files
      if (video.uploadType === 'file') {
        // Set URL for video file if not already set
        if (!video.videoFileUrl) {
          video.setDataValue("videoFileUrl", `/api/v1/videos/${video.id}/file`);
        }
        
        // Set URL for thumbnail file if it exists and not already set
        if (video.thumbnailFile && !video.thumbnailFileUrl) {
          video.setDataValue("thumbnailFileUrl", `/api/v1/videos/${video.id}/thumbnail`);
        }
      }
      
      return res.status(200).json({ success: true, data: video });
    }

    const video = await Video.findByPk(req.params.id, {
      // Exclude large BLOB fields from the main JSON payload
      attributes: { exclude: ["videoFile", "thumbnailFile"] },
      include: [
        {
          model: User,
          attributes: ["id", "username", "avatar"],
        },
      ],
    });

  if (!video) {
    return next({
      message: `No video found for ID - ${req.params.id}`,
      statusCode: 404,
    });
  }

  // For file uploads, provide URLs to access the files
  if (video.uploadType === 'file') {
    // Set URL for video file
    video.setDataValue("videoFileUrl", `/api/v1/videos/${video.id}/file`);
    
    // Set URL for thumbnail file if it exists
    if (video.thumbnailFileSize) {
      video.setDataValue("thumbnailFileUrl", `/api/v1/videos/${video.id}/thumbnail`);
    }
  }

  const comments = await video.getComments({
    order: [["createdAt", "DESC"]],
    attributes: ["id", "text", "createdAt"],
    include: [
      {
        model: User,
        attributes: ["id", "username", "avatar"],
      },
    ],
  });

  // User-specific data only if authenticated
  let isLiked = false;
  let isDisliked = false;
  let isSubscribed = false;
  let isViewed = false;
  let isVideoMine = false;

  if (req.user) {
    try {
      const [likedResult, dislikedResult, subscriptionResult, viewResult] = await Promise.all([
        VideoLike.findOne({
          where: {
            [Op.and]: [
              { videoId: req.params.id },
              { userId: req.user.id },
              { like: 1 },
            ],
          },
        }).catch(() => null),
        VideoLike.findOne({
          where: {
            [Op.and]: [
              { videoId: req.params.id },
              { userId: req.user.id },
              { like: -1 },
            ],
          },
        }).catch(() => null),
        Subscription.findOne({
          where: {
            subscriber: req.user.id,
            subscribeTo: video.userId,
          },
        }).catch(() => null),
        View.findOne({
          where: {
            userId: req.user.id,
            videoId: video.id,
          },
        }).catch(() => null)
      ]);

      isLiked = !!likedResult;
      isDisliked = !!dislikedResult;
      isSubscribed = !!subscriptionResult;
      isViewed = !!viewResult;
      isVideoMine = req.user.id === video.userId;
    } catch (err) {
      console.error('❌ Error fetching user-specific video data:', err.message);
      // Continue with defaults
    }
  }

  // Public data (available to everyone) - optimized with Promise.all
  let commentsCount = 0;
  let likesCount = 0;
  let dislikesCount = 0;
  let views = 0;
  let subscribersCount = 0;

  try {
    [
      commentsCount,
      likesCount,
      dislikesCount,
      views,
      subscribersCount
    ] = await Promise.all([
      Comment.count({ where: { videoId: req.params.id } }).catch(() => 0),
      VideoLike.count({ where: { [Op.and]: [{ videoId: req.params.id }, { like: 1 }] } }).catch(() => 0),
      VideoLike.count({ where: { [Op.and]: [{ videoId: req.params.id }, { like: -1 }] } }).catch(() => 0),
      View.count({ where: { videoId: req.params.id } }).catch(() => 0),
      Subscription.count({ where: { subscribeTo: video.userId } }).catch(() => 0)
    ]);
  } catch (err) {
    console.error('❌ Error fetching public video stats:', err.message);
    // Continue with defaults (0)
  }

  // Set data values
  video.setDataValue("comments", comments);
  video.setDataValue("commentsCount", commentsCount);
  video.setDataValue("isLiked", isLiked);
  video.setDataValue("isDisliked", isDisliked);
  video.setDataValue("likesCount", likesCount);
  video.setDataValue("dislikesCount", dislikesCount);
  video.setDataValue("views", views);
  video.setDataValue("isVideoMine", isVideoMine);
  video.setDataValue("isSubscribed", isSubscribed);
  video.setDataValue("isViewed", isViewed);
  video.setDataValue("subscribersCount", subscribersCount);

    // Cache the result
    setCachedVideoData(req.params.id, video);

    res.status(200).json({ success: true, data: video });
  } catch (error) {
    console.error('❌ Error in getVideo:', error);
    return next({
      message: error.message || 'Failed to load video',
      statusCode: 500,
    });
  }
});

export const likeVideo = asyncHandler(async (req, res, next) => {
  const video = await Video.findByPk(req.params.id);

  if (!video) {
    return next({
      message: `No video found for ID - ${req.params.id}`,
      statusCode: 404,
    });
  }

  const [liked, disliked] = await Promise.all([
    VideoLike.findOne({
      where: {
        userId: req.user.id,
        videoId: req.params.id,
        like: 1,
      },
    }),
    VideoLike.findOne({
      where: {
        userId: req.user.id,
        videoId: req.params.id,
        like: -1,
      },
    })
  ]);

  if (liked) {
    await liked.destroy();
  } else if (disliked) {
    disliked.like = 1;
    await disliked.save();
  } else {
    await VideoLike.create({
      userId: req.user.id,
      videoId: req.params.id,
      like: 1,
    });
  }
  
  // Clear cache when video data changes
  videoCache.delete(req.params.id);

  res.json({ success: true, data: {} });
});

export const dislikeVideo = asyncHandler(async (req, res, next) => {
  const video = await Video.findByPk(req.params.id);

  if (!video) {
    return next({
      message: `No video found for ID - ${req.params.id}`,
      statusCode: 404,
    });
  }

  const [liked, disliked] = await Promise.all([
    VideoLike.findOne({
      where: {
        userId: req.user.id,
        videoId: req.params.id,
        like: 1,
      },
    }),
    VideoLike.findOne({
      where: {
        userId: req.user.id,
        videoId: req.params.id,
        like: -1,
      },
    })
  ]);

  if (disliked) {
    await disliked.destroy();
  } else if (liked) {
    liked.like = -1;
    await liked.save();
  } else {
    await VideoLike.create({
      userId: req.user.id,
      videoId: req.params.id,
      like: -1,
    });
  }
  
  // Clear cache when video data changes
  videoCache.delete(req.params.id);

  res.json({ success: true, data: {} });
});

export const addComment = asyncHandler(async (req, res, next) => {
  const video = await Video.findByPk(req.params.id);

  if (!video) {
    return next({
      message: `No video found for ID - ${req.params.id}`,
      statusCode: 404,
    });
  }

  const comment = await Comment.create({
    text: req.body.text,
    userId: req.user.id,
    videoId: req.params.id,
  });

  const User = {
    id: req.user.id,
    avatar: req.user.avatar,
    username: req.user.username,
  };

  comment.setDataValue("User", User);
  
  // Clear cache when video data changes
  videoCache.delete(req.params.id);

  res.status(200).json({ success: true, data: comment });
});

export const newView = asyncHandler(async (req, res, next) => {
  const video = await Video.findByPk(req.params.id);

  if (!video) {
    return next({
      message: `No video found for ID - ${req.params.id}`,
      statusCode: 404,
    });
  }

  // Only record view if user is authenticated
  if (!req.user) {
    return res.status(200).json({ success: true, data: { message: "View not recorded - user not authenticated" } });
  }

  const viewed = await View.findOne({
    where: {
      userId: req.user.id,
      videoId: req.params.id,
    },
  });

  if (viewed) {
    return next({ message: "You already viewed this video", statusCode: 400 });
  }

  await View.create({
    userId: req.user.id,
    videoId: req.params.id,
  });
  
  // Clear cache when video data changes
  videoCache.delete(req.params.id);

  res.status(200).json({ success: true, data: {} });
});

export const searchVideo = asyncHandler(async (req, res, next) => {
  if (!req.query.searchterm) {
    return next({ message: "Please enter the searchterm", statusCode: 400 });
  }

  const videos = await Video.findAll({
    attributes: ["id", "title", "description", "thumbnail", "createdAt", "category", "uploadType"],
    include: { model: User, attributes: ["id", "avatar", "username"] },
    where: {
      [Op.or]: {
        title: {
          [Op.substring]: req.query.searchterm,
        },
        description: {
          [Op.substring]: req.query.searchterm,
        },
      },
    },
  });

  if (!videos.length)
    return res.status(200).json({ success: true, data: videos });

  // Optimize view count fetching with Promise.all
  await Promise.all(videos.map(async (video) => {
    const views = await View.count({ where: { videoId: video.id } });
    video.setDataValue("views", views);
    
    // For file uploads, provide URLs to access the files
    if (video.uploadType === 'file') {
      // Set URL for thumbnail file if it exists
      if (video.thumbnailFile) {
        video.setDataValue("thumbnailFileUrl", `/api/v1/videos/${video.id}/thumbnail`);
      }
    }
  }));

  res.status(200).json({ success: true, data: videos });
});