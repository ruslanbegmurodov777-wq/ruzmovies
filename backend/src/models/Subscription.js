import { Sequelize } from "sequelize";

export default (sequelize, DataTypes) =>
  sequelize.define("Subscription", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    subscriber: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });