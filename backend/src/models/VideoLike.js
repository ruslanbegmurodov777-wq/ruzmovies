import { Sequelize } from "sequelize";

export default (sequelize, DataTypes) =>
  sequelize.define(
    "VideoLike",
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      videoId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      like: {
        type: DataTypes.INTEGER, // 1 or -1
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["userId", "videoId"],
        },
      ],
    }
  );