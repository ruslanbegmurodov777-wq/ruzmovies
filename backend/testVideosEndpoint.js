import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { sequelize, User, Video } from "./src/sequelize.js";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend root directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log("Environment variables:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_DIALECT:", process.env.DB_DIALECT);
console.log("JWT_SECRET set:", !!process.env.JWT_SECRET);

// Test database connection and fetch videos
(async () => {
  try {
    console.log("🚀 Attempting to connect to database...");
    
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Test fetching users
    console.log("Fetching users...");
    const users = await User.findAll();
    console.log(`✅ Found ${users.length} users`);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.email})`);
    });

    // Test fetching videos
    console.log("Fetching videos...");
    const videos = await Video.findAll({
      include: [{
        model: User,
        attributes: ["id", "username", "avatar"]
      }]
    });
    
    console.log(`✅ Found ${videos.length} videos`);
    videos.forEach(video => {
      console.log(`  - ${video.title} (${video.category}) by ${video.User?.username || 'Unknown'}`);
      console.log(`    Upload type: ${video.uploadType}`);
      console.log(`    Has video file: ${!!video.videoFile}`);
      console.log(`    Has thumbnail file: ${!!video.thumbnailFile}`);
      console.log(`    URL: ${video.url}`);
      console.log(`    Thumbnail: ${video.thumbnail}`);
    });

    await sequelize.close();
    console.log("✅ Database connection closed.");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Error stack:", error.stack);
  }
})();