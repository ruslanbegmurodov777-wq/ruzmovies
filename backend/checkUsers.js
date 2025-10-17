import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: './.env' });

// Aiven MySQL configuration using environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME || 'defaultdb', // DB_NAME
  process.env.DB_USER || 'avnadmin', // DB_USER
  process.env.DB_PASS, // DB_PASS - required
  {
    host: process.env.DB_HOST || 'mysql-176744c3-ruzmovie.b.aivencloud.com', // DB_HOST
    port: process.env.DB_PORT || 22011, // DB_PORT
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

// Check users in database
(async () => {
  try {
    console.log("🚀 Connecting to Aiven MySQL database...");
    
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
    
    // Fetch all users
    const [users] = await sequelize.query("SELECT id, firstname, lastname, username, email, isAdmin FROM Users");
    console.log("👥 Users in database:");
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.firstname} ${user.lastname} (${user.username}) - ${user.email} ${user.isAdmin ? '(Admin)' : ''}`);
    });
    
    // Fetch all videos
    const [videos] = await sequelize.query("SELECT id, title, description, userId FROM Videos");
    console.log("🎬 Videos in database:");
    videos.forEach((video, index) => {
      console.log(`  ${index + 1}. ${video.title} - ${video.description || 'No description'} (User ID: ${video.userId})`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
})();