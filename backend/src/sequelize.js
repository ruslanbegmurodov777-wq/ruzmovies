import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// __dirname olish
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env yuklash
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Aiven SSL ulanishini aniqlash
const isAiven = process.env.DB_HOST?.includes("aivencloud.com");

// Sequelize sozlamalari
const sequelize = new Sequelize(
  process.env.DB_NAME || "defaultdb",
  process.env.DB_USER || "avnadmin",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "mysql-176744c3-ruzmovie.b.aivencloud.com",
    port: process.env.DB_PORT || 22011,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: false,

    dialectOptions: {
      ssl: isAiven
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
      connectTimeout: 120000, // 120s — Render’da sekin tarmoqlar uchun
    },

    pool: {
      max: 5,
      min: 0,
      acquire: 120000,
      idle: 10000,
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /SequelizeConnectionError/,
      ],
      max: 5,
    },
  }
);

// Ulanishni test qilish
(async () => {
  try {
    console.log("🔌 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
})();

// Modellarni import qilish
import UserModel from "./models/User.js";
import VideoModel from "./models/Video.js";
import VideoLikeModel from "./models/VideoLike.js";
import CommentModel from "./models/Comment.js";
import SubscriptionModel from "./models/Subscription.js";
import ViewModel from "./models/View.js";

// Model yaratish
const User = UserModel(sequelize, DataTypes);
const Video = VideoModel(sequelize, DataTypes);
const VideoLike = VideoLikeModel(sequelize, DataTypes);
const Comment = CommentModel(sequelize, DataTypes);
const Subscription = SubscriptionModel(sequelize, DataTypes);
const View = ViewModel(sequelize, DataTypes);

// Aloqalarni o‘rnatish
Video.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Video, { foreignKey: "userId" });
Video.hasMany(Comment, { foreignKey: "videoId" });
Comment.belongsTo(User, { foreignKey: "userId" });
Comment.belongsTo(Video, { foreignKey: "videoId" });

// Likes: many-to-many between Users and Videos through VideoLike
User.belongsToMany(Video, {
  through: VideoLike,
  foreignKey: "userId",
  otherKey: "videoId",
  as: "LikedVideos",
});
Video.belongsToMany(User, {
  through: VideoLike,
  foreignKey: "videoId",
  otherKey: "userId",
  as: "UsersWhoLiked",
});

// Views: many-to-many between Users and Videos through View
User.belongsToMany(Video, {
  through: View,
  foreignKey: "userId",
  otherKey: "videoId",
  as: "ViewedVideos",
});
Video.belongsToMany(User, {
  through: View,
  foreignKey: "videoId",
  otherKey: "userId",
  as: "Viewers",
});

// Ensure DB schema is up to date (adds missing columns/indexes) - AFTER all associations
(async () => {
  try {
    await sequelize.sync({ alter: true });
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Models synchronized (alter)");
    }
  } catch (e) {
    console.error("❌ Sequelize sync failed:", e?.message);
  }
})();

export { sequelize, User, Video, VideoLike, Comment, Subscription, View };
export default sequelize;

// Admin foydalanuvchini bootstrap qilish (agar mavjud bo'lmasa)
(async () => {
  try {
    const adminEmail =
      process.env.ADMIN_EMAIL || "ruslanbegmurodov777@gmail.com";
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const defaultPass = process.env.ADMIN_DEFAULT_PASS || "admin123";

    const exists = await User.findOne({ where: { email: adminEmail } });
    if (!exists) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(defaultPass, salt);
      await User.create({
        firstname: "Admin",
        lastname: "User",
        username: adminUsername,
        email: adminEmail,
        password: hashed,
        isAdmin: true,
      });
      if (process.env.NODE_ENV !== "production") {
        console.log(`✅ Admin created: ${adminEmail}`);
      }
      (async () => {
        try {
          // Ensure tables and new columns/indexes exist
          await sequelize.sync({ alter: true });
          if (process.env.NODE_ENV !== "production") {
            console.log("✅ Models synchronized (alter)");
          }
        } catch (e) {
          if (process.env.NODE_ENV !== "production") {
            console.error("❌ Admin bootstrap failed:", e?.message);
          }
        }
      })();
    }
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("❌ Admin bootstrap failed:", e?.message);
    }
  }
})();
