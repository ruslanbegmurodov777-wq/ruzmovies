import { Sequelize } from "sequelize";

export default (sequelize, DataTypes) =>
  sequelize.define("View", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
  });