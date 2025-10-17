import path from "path";
import multer from "multer";
import { User, Video } from "../sequelize.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const addVideo = asyncHandler(async (req, res, next) => {
  const video = await Video.create({
    ...req.body,
    userId: req.user.id,
  });

  res.status(200).json({ success: true, data: video });
});

export const getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.findAll({
    attributes: ["id", "firstname", "lastname", "username", "email", "avatar", "isAdmin"],
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
    attributes: ["id", "title", "description", "url", "thumbnail", "featured", "userId", "category", "uploadType", "fileName", "fileSize", "mimeType"],
  });

  res.status(200).json({ success: true, data: videos });
});

export const updateVideo = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, url, thumbnail, featured, category } = req.body;

  const video = await Video.findByPk(id);
  if (!video) {
    return next({ message: "Video not found", statusCode: 404 });
  }

  await Video.update(
    { title, description, url, thumbnail, featured, category },
    { where: { id } }
  );

  const updatedVideo = await Video.findByPk(id);
  res.status(200).json({ success: true, data: updatedVideo });
});