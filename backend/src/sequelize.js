import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env (root-level)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Detect if Aiven MySQL (needs SSL)
const isAiven = process.env.DB_HOST?.includes("aivencloud.com");

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: false,
    dialectOptions: {
      ssl: isAiven
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : undefined,
      connectTimeout: 90000, // 90s timeout
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 120000, // wait up to 2 min
      idle: 20000,
      evict: 10000,
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /SequelizeConnectionError/,
      ],
      max: 5, // Retry 5 times
    },
  }
);

// Test connection with retries
const connectWithRetry = async (retries = 5) => {
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log("✅ Database connection established successfully.");
      await sequelize.sync({ alter: false });
      console.log("✅ Models synchronized successfully.");
      return;
    } catch (error) {
      console.error("❌ DB connection failed:", error.message);
      retries -= 1;
      if (!retries) {
        console.error("⛔ Giving up after multiple retries.");
        process.exit(1);
      }
      console.log(`🔄 Retrying in 5s... (${retries} retries left)`);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};
connectWithRetry();

// Import Models
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

// Define relationships
Video.belongsTo(User, { foreignKey: "userId" });
User.belongsToMany(Video, { through: VideoLike, foreignKey: "userId" });
Video.belongsToMany(User, { through: VideoLike, foreignKey: "videoId" });
User.hasMany(Comment, { foreignKey: "userId" });
Comment.belongsTo(User, { foreignKey: "userId" });
Video.hasMany(Comment, { foreignKey: "videoId" });
User.hasMany(Subscription, { foreignKey: "subscribeTo" });
User.belongsToMany(Video, { through: View, foreignKey: "userId" });
Video.belongsToMany(User, { through: View, foreignKey: "videoId" });

// Admin auto-creation
(async () => {
  try {
    const adminExists = await User.findOne({
      where: { email: "admin@movie.com" },
    });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_DEFAULT_PASS || "admin123",
        salt
      );
      await User.create({
        firstname: "Admin",
        lastname: "User",
        username: "admin",
        email: "admin@movie.com",
        password: hashedPassword,
        isAdmin: true,
      });
      console.log("✅ Default admin created: admin@movie.com / admin123");
    }
  } catch (err) {
    console.error("⚠️ Admin creation failed:", err.message);
  }
})();

export { sequelize, User, Video, VideoLike, Comment, Subscription, View };
export default sequelize;
