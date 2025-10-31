export default (sequelize, DataTypes) => {
  return sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Default categories (Movies, Music, etc.) cannot be deleted'
    }
  }, {
    tableName: 'categories',
    timestamps: true,
  });
};
