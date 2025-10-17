import { Sequelize } from "sequelize";

export default (sequelize, DataTypes) =>
  sequelize.define("VideoLike", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    like: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });