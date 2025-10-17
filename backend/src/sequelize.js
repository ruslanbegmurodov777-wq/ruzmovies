import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Detect Aiven MySQL (ssl required)
const isAiven = process.env.DB_HOST?.includes("aivencloud.com");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: false,

    dialectOptions: isAiven
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
          connectTimeout: 60000,
        }
      : {
          connectTimeout: 60000,
        },

    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
  }
);

// Test connection
(async () => {
  try {
    console.log("🚀 Attempting to connect to database...");
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`SSL Required: ${isAiven ? "✅ Yes" : "❌ No"}`);

    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    await sequelize.sync({ force: false });
    console.log("✅ All models synchronized successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to database:", error.message);
    console.error("Error code:", error.original?.code);
  }
})();

// Models
import UserModel from "./models/User.js";
import VideoModel from "./models/Video.js";
import VideoLikeModel from "./models/VideoLike.js";
import CommentModel from "./models/Comment.js";
import SubscriptionModel from "./models/Subscription.js";
import ViewModel from "./models/View.js";

const User = UserModel(sequelize, DataTypes);
const Video = VideoModel(sequelize, DataTypes);
const VideoLike = VideoLikeModel(sequelize, DataTypes);
const Comment = CommentModel(sequelize, DataTypes);
const Subscription = SubscriptionModel(sequelize, DataTypes);
const View = ViewModel(sequelize, DataTypes);

// Relationships
Video.belongsTo(User, { foreignKey: "userId" });
User.belongsToMany(Video, { through: VideoLike, foreignKey: "userId" });
Video.belongsToMany(User, { through: VideoLike, foreignKey: "videoId" });
User.hasMany(Comment, { foreignKey: "userId" });
Comment.belongsTo(User, { foreignKey: "userId" });
Video.hasMany(Comment, { foreignKey: "videoId" });
User.hasMany(Subscription, { foreignKey: "subscribeTo" });
User.belongsToMany(Video, { through: View, foreignKey: "userId" });
Video.belongsToMany(User, { through: View, foreignKey: "videoId" });

// Create admin
(async () => {
  try {
    const adminExists = await User.findOne({
      where: { email: "admin@movie.com" },
    });
    if (!adminExists) {
     const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASS, salt);

      await User.create({
        firstname: "Admin",
        lastname: "User",
        username: "admin",
        email: "admin@movie.com",
        password: hashedPassword,
        isAdmin: true,
      });

      console.log("✅ Admin user created (admin@movie.com / admin123)");
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
  }
})();

export { sequelize, User, Video, VideoLike, Comment, Subscription, View };
export default sequelize;