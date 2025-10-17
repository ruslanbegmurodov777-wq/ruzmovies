import { Sequelize } from "sequelize";

export default (sequelize, DataTypes) => {
  return sequelize.define("Video", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true, // Now optional since we can have file uploads
    },
    thumbnail: {
      type: DataTypes.STRING,
      allowNull: true, // Make thumbnail optional to support file uploads without thumbnails
      defaultValue: null // Explicitly set default to null
    },
    featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    category: {
      type: DataTypes.ENUM('movies', 'music', 'dramas', 'cartoons'),
      allowNull: false,
      defaultValue: 'movies',
    },
    // New fields for file upload
    videoFile: {
      type: DataTypes.BLOB('long'), // LONGBLOB for storing video files
      allowNull: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    uploadType: {
      type: DataTypes.ENUM('url', 'file'),
      allowNull: false,
      defaultValue: 'url',
    },
    // New fields for thumbnail file upload
    thumbnailFile: {
      type: DataTypes.BLOB('long'), // LONGBLOB for storing thumbnail files
      allowNull: true,
    },
    thumbnailFileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    thumbnailFileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    thumbnailMimeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });
};