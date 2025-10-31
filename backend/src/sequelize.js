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
import CategoryModel from "./models/Category.js";

// Model yaratish
const User = UserModel(sequelize, DataTypes);
const Video = VideoModel(sequelize, DataTypes);
const VideoLike = VideoLikeModel(sequelize, DataTypes);
const Comment = CommentModel(sequelize, DataTypes);
const Subscription = SubscriptionModel(sequelize, DataTypes);
const View = ViewModel(sequelize, DataTypes);
const Category = CategoryModel(sequelize, DataTypes);

// Aloqalarni o‘rnatish
Video.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Video, { foreignKey: "userId" });
Video.hasMany(Comment, { foreignKey: "videoId" });
Comment.belongsTo(User, { foreignKey: "userId" });
Comment.belongsTo(Video, { foreignKey: "videoId" });

// Category relationships - DISABLED: We use category (string slug) instead of categoryId (foreign key)
// Video.belongsTo(Category, { foreignKey: "categoryId", as: "videoCategory" });
// Category.hasMany(Video, { foreignKey: "categoryId" });

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

export { sequelize, User, Video, VideoLike, Comment, Subscription, View, Category };
export default sequelize;

// Sync database and seed data - AFTER all associations and exports
(async () => {
  try {
    // 1. Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connected");
    
    // 2. Add isOwner column if it doesn't exist (before sync to avoid conflicts)
    try {
      const [results] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Users' 
        AND COLUMN_NAME = 'isOwner'
      `);
      
      if (results[0].count === 0) {
        await sequelize.query(`
          ALTER TABLE Users ADD COLUMN isOwner TINYINT(1) DEFAULT 0 COMMENT 'Site owner - super admin'
        `);
        console.log("✅ isOwner column added");
      } else {
        console.log("✅ isOwner column exists");
      }
    } catch (e) {
      console.log("ℹ️  isOwner check: " + e.message);
    }

    // 2.5. Remove categoryId column if it exists (migration fix)
    try {
      const [categoryIdResults] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Videos' 
        AND COLUMN_NAME = 'categoryId'
      `);
      
      if (categoryIdResults[0].count > 0) {
        console.log("🔄 Removing categoryId column from Videos table...");
        await sequelize.query(`
          ALTER TABLE Videos DROP COLUMN categoryId
        `);
        console.log("✅ categoryId column removed from Videos table");
      } else {
        console.log("ℹ️  categoryId column does not exist (already cleaned)");
      }
    } catch (e) {
      console.error("⚠️  categoryId removal failed:", e.message);
    }

    // 2.6. Check and fix category column size
    try {
      const [categoryColInfo] = await sequelize.query(`
        SELECT CHARACTER_MAXIMUM_LENGTH, DATA_TYPE, COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Videos' 
        AND COLUMN_NAME = 'category'
      `);
      
      if (categoryColInfo && categoryColInfo.length > 0) {
        const colInfo = categoryColInfo[0];
        console.log(`ℹ️  category column: ${colInfo.COLUMN_TYPE}`);
        
        // If it's VARCHAR and less than 50 chars, expand it
        if (colInfo.DATA_TYPE === 'varchar' && colInfo.CHARACTER_MAXIMUM_LENGTH < 50) {
          console.log("🔄 Expanding category column to VARCHAR(255)...");
          await sequelize.query(`
            ALTER TABLE Videos MODIFY COLUMN category VARCHAR(255) NOT NULL DEFAULT 'movies'
          `);
          console.log("✅ category column expanded");
        } else if (colInfo.COLUMN_TYPE.includes('enum')) {
          console.log("🔄 Converting category from ENUM to VARCHAR(255)...");
          await sequelize.query(`
            ALTER TABLE Videos MODIFY COLUMN category VARCHAR(255) NOT NULL DEFAULT 'movies'
          `);
          console.log("✅ category column converted to VARCHAR");
        }
      }
    } catch (e) {
      console.error("⚠️  category column check failed:", e.message);
    }
    
    // 3. Sync only new tables (don't alter existing ones)
    console.log("🔄 Syncing database models...");
    await sequelize.sync({ force: false, alter: false });
    console.log("✅ Models synchronized");

    // 2. Seed admin user
    const adminEmail = process.env.ADMIN_EMAIL || "ruslanbegmurodov777@gmail.com";
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const defaultPass = process.env.ADMIN_DEFAULT_PASS || "admin123";

    const adminExists = await User.findOne({ where: { email: adminEmail } });
    if (!adminExists) {
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
      console.log(`✅ Admin created: ${adminEmail}`);
    } else if (!adminExists.isAdmin) {
      await User.update({ isAdmin: true }, { where: { email: adminEmail } });
      console.log(`✅ User promoted to admin: ${adminEmail}`);
    } else {
      console.log(`✅ Admin already exists: ${adminEmail}`);
    }

    // 3. Set site owner
    const ownerEmail = "ruztubeagent@gmail.com";
    const owner = await User.findOne({ where: { email: ownerEmail } });
    if (owner && !owner.isOwner) {
      await User.update({ isOwner: true, isAdmin: true }, { where: { email: ownerEmail } });
      console.log(`✅ Site owner set: ${ownerEmail}`);
    } else if (owner && owner.isOwner) {
      console.log(`✅ Site owner already exists: ${ownerEmail}`);
    }

    // 4. Seed default categories
    const defaultCategories = [
      { name: 'Movies', slug: 'movies', order: 0, isDefault: true },
      { name: 'Music', slug: 'music', order: 1, isDefault: true },
      { name: 'Dramas', slug: 'dramas', order: 2, isDefault: true },
      { name: 'Cartoons', slug: 'cartoons', order: 3, isDefault: true },
    ];

    for (const cat of defaultCategories) {
      const exists = await Category.findOne({ where: { slug: cat.slug } });
      if (!exists) {
        await Category.create(cat);
        console.log(`✅ Category created: ${cat.name}`);
      }
    }
    console.log("✅ Database initialization complete");

  } catch (e) {
    console.error("❌ Database initialization failed:", e?.message);
    console.error(e);
  }
})();
