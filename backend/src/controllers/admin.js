import { User, Video, sequelize } from "../sequelize.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const addVideo = asyncHandler(async (req, res, next) => {
  const { title, description, url, thumbnail, featured, category } = req.body;
  const video = await Video.create({
    title,
    description,
    url,
    thumbnail,
    featured: featured !== undefined ? featured : true,
    category: category || 'movies',
    userId: req.user.id,
  });

  res.status(200).json({ success: true, data: video });
});

export const getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.findAll({
    attributes: ["id", "firstname", "lastname", "username", "email", "avatar", "isAdmin", "isOwner"],
  });

  res.status(200).json({ success: true, data: users });
});

export const removeUser = asyncHandler(async (req, res, next) => {
  await User.destroy({
    where: { username: req.params.username },
  });

  res.status(200).json({ success: true, data: {} });
});

export const removeVideo = asyncHandler(async (req, res, next) => {
  await Video.destroy({
    where: { id: req.params.id },
  });

  res.status(200).json({ success: true, data: {} });
});

export const getVideos = asyncHandler(async (req, res, next) => {
  const videos = await Video.findAll({
    attributes: [
      "id",
      "title",
      "description",
      "url",
      "thumbnail",
      "thumbnailFileSize",
      "featured",
      "userId",
      "category",
      "uploadType",
      "fileName",
      "fileSize",
      "mimeType",
    ],
  });

  // Attach thumbnailFileUrl for file uploads where a thumbnail exists
  videos.forEach((video) => {
    if (video.uploadType === 'file' && video.thumbnailFileSize) {
      video.setDataValue("thumbnailFileUrl", `/api/v1/videos/${video.id}/thumbnail`);
    }
  });

  res.status(200).json({ success: true, data: videos });
});

export const updateVideo = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const { title, description, url, thumbnail, featured, category } = req.body;

    // Check if video exists
    const video = await Video.findByPk(id);
    if (!video) {
      return next({ message: "Video not found", statusCode: 404 });
    }

    // Debug log
    console.log("Update data:", {
      id,
      title,
      description,
      url,
      thumbnail,
      featured,
      category,
      categoryLength: category?.length,
      categoryType: typeof category
    });

    // Use raw SQL query to avoid categoryId field issues
    await sequelize.query(
      `UPDATE Videos 
       SET title = :title, 
           description = :description, 
           url = :url, 
           thumbnail = :thumbnail, 
           featured = :featured, 
           category = :category,
           updatedAt = NOW()
       WHERE id = :id`,
      {
        replacements: {
          id,
          title: title || video.title,
          description: description || video.description,
          url: url || video.url,
          thumbnail: thumbnail || video.thumbnail,
          featured: featured !== undefined ? featured : video.featured,
          category: category || video.category
        },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    const updatedVideo = await Video.findByPk(id);
    res.status(200).json({ success: true, data: updatedVideo });
  } catch (error) {
    console.error("Error updating video:", error.message);
    console.error("Error stack:", error.stack);
    return next({ 
      message: error.message || "Failed to update video", 
      statusCode: 500 
    });
  }
});

export const promoteToAdmin = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findByPk(userId);
  if (!user) {
    return next({ message: "User not found", statusCode: 404 });
  }

  await User.update({ isAdmin: true }, { where: { id: userId } });

  const updatedUser = await User.findByPk(userId, {
    attributes: ["id", "firstname", "lastname", "username", "email", "isAdmin"],
  });

  res.status(200).json({ success: true, data: updatedUser });
});

export const revokeAdmin = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findByPk(userId);
  if (!user) {
    return next({ message: "User not found", statusCode: 404 });
  }

  await User.update({ isAdmin: false }, { where: { id: userId } });

  const updatedUser = await User.findByPk(userId, {
    attributes: ["id", "firstname", "lastname", "username", "email", "isAdmin"],
  });

  res.status(200).json({ success: true, data: updatedUser });
});