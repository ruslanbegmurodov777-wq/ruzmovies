import { Op } from "sequelize";
import { VideoLike, Video, User, Subscription, View, sequelize } from "../sequelize.js";
import asyncHandler from "../middlewares/asyncHandler.js";

// Cache for frequently accessed data
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const toggleSubscribe = asyncHandler(async (req, res, next) => {
  if (req.user.id === req.params.id) {
    return next({
      message: "You cannot to subscribe to your own channel",
      statusCode: 400,
    });
  }

  const user = await User.findByPk(req.params.id);

  if (!user) {
    return next({
      message: `No user found for ID - '${req.params.id}'`,
      statusCode: 404,
    });
  }

  const isSubscribed = await Subscription.findOne({
    where: {
      subscriber: req.user.id,
      subscribeTo: req.params.id,
    },
  });

  if (isSubscribed) {
    await Subscription.destroy({
      where: {
        subscriber: req.user.id,
        subscribeTo: req.params.id,
      },
    });
  } else {
    await Subscription.create({
      subscriber: req.user.id,
      subscribeTo: req.params.id,
    });
  }
  
  // Clear cache when subscription data changes
  userCache.clear();

  res.status(200).json({ success: true, data: {} });
});

export const getFeed = asyncHandler(async (req, res, next) => {
  const subscribedTo = await Subscription.findAll({
    where: {
      subscriber: req.user.id,
    },
  });

  const subscriptions = subscribedTo.map((sub) => sub.subscribeTo);

  const feed = await Video.findAll({
    attributes: [
      "id",
      "title",
      "description",
      "thumbnail",
      "thumbnailFileSize",
      "createdAt",
      "category",
      "uploadType",
    ],
    include: {
      model: User,
      attributes: ["id", "avatar", "username"],
    },
    where: {
      userId: {
        [Op.in]: subscriptions,
      },
    },
    order: [["createdAt", "DESC"]],
  });

  if (!feed.length) {
    return res.status(200).json({ success: true, data: feed });
  }

  // Optimize view count fetching with Promise.all
  await Promise.all(feed.map(async (video) => {
    const views = await View.count({ where: { videoId: video.id } });
    video.setDataValue("views", views);
    // Provide thumbnail URL for file uploads
    if (video.uploadType === 'file' && video.thumbnailFileSize) {
      video.setDataValue("thumbnailFileUrl", `/api/v1/videos/${video.id}/thumbnail`);
    }
  }));

  res.status(200).json({ success: true, data: feed });
});

export const editUser = asyncHandler(async (req, res, next) => {
  await User.update(req.body, {
    where: { id: req.user.id },
  });

  const user = await User.findByPk(req.user.id, {
    attributes: [
      "id",
      "firstname",
      "lastname",
      "username",
      "channelDescription",
      "avatar",
      "cover",
      "email",
    ],
  });
  
  // Clear cache when user data changes
  userCache.clear();

  res.status(200).json({ success: true, data: user });
});

export const searchUser = asyncHandler(async (req, res, next) => {
  if (!req.query.searchterm) {
    return next({ message: "Please enter your search term", statusCode: 400 });
  }

  const users = await User.findAll({
    attributes: ["id", "username", "avatar", "channelDescription"],
    where: {
      username: {
        [Op.substring]: req.query.searchterm,
      },
    },
  });

  if (!users.length)
    return res.status(200).json({ success: true, data: users });

  // Optimize data fetching with Promise.all
  await Promise.all(users.map(async (user) => {
    const [subscribersCount, videosCount, subscriptionResult] = await Promise.all([
      Subscription.count({
        where: { subscribeTo: user.id },
      }),
      Video.count({
        where: { userId: user.id },
      }),
      Subscription.findOne({
        where: {
          [Op.and]: [{ subscriber: req.user.id }, { subscribeTo: user.id }],
        },
      })
    ]);

    const isMe = req.user.id === user.id;

    user.setDataValue("subscribersCount", subscribersCount);
    user.setDataValue("videosCount", videosCount);
    user.setDataValue("isSubscribed", !!subscriptionResult);
    user.setDataValue("isMe", isMe);
  }));

  res.status(200).json({ success: true, data: users });
});

// Helper function to get cached user data
const getCachedUserData = (userId) => {
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

// Helper function to set cached user data
const setCachedUserData = (userId, data) => {
  userCache.set(userId, {
    data,
    timestamp: Date.now()
  });
};

export const getProfile = asyncHandler(async (req, res, next) => {
  // Check cache first
  const cachedData = getCachedUserData(req.params.id);
  if (cachedData) {
    return res.status(200).json({ success: true, data: cachedData });
  }

  const user = await User.findByPk(req.params.id, {
    attributes: [
      "id",
      "firstname",
      "lastname",
      "username",
      "cover",
      "avatar",
      "email",
      "channelDescription",
    ],
  });

  if (!user) {
    return next({
      message: `No user found for ID - ${req.params.id}`,
      statusCode: 404,
    });
  }

  // subscribersCount, isMe, isSubscribed
  const [subscribersCount, isSubscribed, subscriptions] = await Promise.all([
    Subscription.count({
      where: { subscribeTo: req.params.id },
    }),
    Subscription.findOne({
      where: {
        [Op.and]: [{ subscriber: req.user.id }, { subscribeTo: req.params.id }],
      },
    }),
    Subscription.findAll({
      where: { subscriber: req.params.id },
    })
  ]);

  user.setDataValue("subscribersCount", subscribersCount);

  const isMe = req.user.id === req.params.id;
  user.setDataValue("isMe", isMe);
  user.setDataValue("isSubscribed", !!isSubscribed);

  // find the channels this user is subscribed to
  const channelIds = subscriptions.map((sub) => sub.subscribeTo);

  const channels = await User.findAll({
    attributes: ["id", "avatar", "username"],
    where: {
      id: { [Op.in]: channelIds },
    },
  });

  // Optimize subscribers count fetching with Promise.all
  await Promise.all(channels.map(async (channel) => {
    const subscribersCount = await Subscription.count({
      where: { subscribeTo: channel.id },
    });
    channel.setDataValue("subscribersCount", subscribersCount);
  }));

  user.setDataValue("channels", channels);

  const videos = await Video.findAll({
    where: { userId: req.params.id },
    attributes: [
      "id",
      "thumbnail",
      "thumbnailFileSize",
      "title",
      "createdAt",
      "category",
      "uploadType",
    ],
  });

  if (videos.length > 0) {
    // Optimize view count fetching with Promise.all
    await Promise.all(videos.map(async (video) => {
      const views = await View.count({ where: { videoId: video.id } });
      video.setDataValue("views", views);
      if (video.uploadType === 'file' && video.thumbnailFileSize) {
        video.setDataValue("thumbnailFileUrl", `/api/v1/videos/${video.id}/thumbnail`);
      }
    }));
  }

  user.setDataValue("videos", videos);
  
  // Cache the result
  setCachedUserData(req.params.id, user);

  res.status(200).json({ success: true, data: user });
});

export const recommendedVideos = asyncHandler(async (req, res, next) => {
  const { limit = 12, offset = 0 } = req.pagination || {};
  const { category } = req.query || {};
  const where = {};
  if (category && category !== 'all') {
    where.category = category;
  }

  const videos = await Video.findAll({
    attributes: [
      "id",
      "title",
      "description",
      "thumbnail",
      "thumbnailFileSize",
      "userId",
      "createdAt",
      "category",
      "featured",
      "uploadType",
    ],
    include: [{ model: User, attributes: ["id", "avatar", "username"] }],
    order: [
      ["featured", "DESC"],
      ["createdAt", "DESC"],
    ],
    where,
    limit,
    offset,
  });

  if (!videos.length)
    return res.status(200).json({ success: true, data: videos });

  // Bulk-fetch view counts in one grouped query to avoid N+1
  const ids = videos.map(v => v.id);
  const viewRows = await View.findAll({
    attributes: [
      'videoId',
      [sequelize.fn('COUNT', sequelize.col('videoId')), 'views']
    ],
    where: { videoId: ids },
    group: ['videoId']
  });
  const viewMap = new Map(viewRows.map(r => [r.get('videoId'), Number(r.get('views'))]));

  videos.forEach((video) => {
    const views = viewMap.get(video.id) || 0;
    video.setDataValue("views", views);
    if (video.uploadType === 'file' && video.thumbnailFileSize) {
      video.setDataValue("thumbnailFileUrl", `/api/v1/videos/${video.id}/thumbnail`);
    }
  });

  res.status(200).json({ success: true, data: videos });
});

export const recommendChannels = asyncHandler(async (req, res, next) => {
  const channels = await User.findAll({
    limit: 10,
    attributes: ["id", "username", "avatar", "channelDescription"],
    where: {
      id: {
        [Op.not]: req.user.id,
      },
    },
  });

  if (!channels.length)
    return res.status(200).json({ success: true, data: channels });

  // Optimize data fetching with Promise.all
  await Promise.all(channels.map(async (channel) => {
    const [subscribersCount, subscriptionResult, videosCount] = await Promise.all([
      Subscription.count({
        where: { subscribeTo: channel.id },
      }),
      Subscription.findOne({
        where: {
          subscriber: req.user.id,
          subscribeTo: channel.id,
        },
      }),
      Video.count({ where: { userId: channel.id } })
    ]);

    channel.setDataValue("subscribersCount", subscribersCount);
    channel.setDataValue("isSubscribed", !!subscriptionResult);
    channel.setDataValue("videosCount", videosCount);
  }));

  res.status(200).json({ success: true, data: channels });
});

export const getLikedVideos = asyncHandler(async (req, res, next) => {
  return getVideos(VideoLike, req, res, next);
});

export const getHistory = asyncHandler(async (req, res, next) => {
  return getVideos(View, req, res, next);
});

const getVideos = async (model, req, res, next) => {
  const videoRelations = await model.findAll({
    where: { userId: req.user.id },
    order: [["createdAt", "ASC"]],
  });

  const videoIds = videoRelations.map((videoRelation) => videoRelation.videoId);

  const videos = await Video.findAll({
    attributes: [
      "id",
      "title",
      "description",
      "createdAt",
      "thumbnail",
      "thumbnailFileSize",
      "url",
      "category",
      "uploadType",
    ],
    include: {
      model: User,
      attributes: ["id", "username", "avatar"],
    },
    where: {
      id: {
        [Op.in]: videoIds,
      },
    },
  });

  if (!videos.length) {
    return res.status(200).json({ success: true, data: videos });
  }

  // Optimize view count fetching with Promise.all
  await Promise.all(videos.map(async (video) => {
    const views = await View.count({ where: { videoId: video.id } });
    video.setDataValue("views", views);
    // Provide thumbnail URL for file uploads so frontend shows thumbnails
    if (video.uploadType === 'file' && video.thumbnailFileSize) {
      video.setDataValue("thumbnailFileUrl", `/api/v1/videos/${video.id}/thumbnail`);
    }
  }));

  res.status(200).json({ success: true, data: videos });
};

// Toggle admin status - only site owner can do this
export const toggleAdmin = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  // Check if requesting user is owner
  if (!req.user.isOwner) {
    return next({
      message: "Only site owner can manage admin status",
      statusCode: 403,
    });
  }

  const targetUser = await User.findByPk(userId);
  if (!targetUser) {
    return next({
      message: `User not found with ID: ${userId}`,
      statusCode: 404,
    });
  }

  // Cannot change owner's admin status
  if (targetUser.isOwner) {
    return next({
      message: "Cannot change site owner's admin status",
      statusCode: 400,
    });
  }

  // Toggle admin status
  const newAdminStatus = !targetUser.isAdmin;
  await User.update(
    { isAdmin: newAdminStatus },
    { where: { id: userId } }
  );

  res.status(200).json({ 
    success: true, 
    data: { 
      userId, 
      isAdmin: newAdminStatus,
      message: newAdminStatus ? 'User promoted to admin' : 'Admin status removed'
    } 
  });
});