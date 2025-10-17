import { Sequelize } from "sequelize";

export default (sequelize, DataTypes) =>
  sequelize.define("Comment", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });