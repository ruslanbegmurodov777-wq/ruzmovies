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

// Test connection and fetch data
(async () => {
  try {
    console.log("🚀 Attempting to connect to Aiven MySQL database...");
    
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
    
    // List all tables
    const tables = await sequelize.getQueryInterface().showAllSchemas();
    console.log("📋 Tables in database:", tables);
    
    // Try to fetch data from Users table if it exists
    try {
      const [users] = await sequelize.query("SELECT COUNT(*) as count FROM Users");
      console.log("👤 Users count:", users[0].count);
    } catch (error) {
      console.log("ℹ️  Users table may not exist or is empty");
    }
    
    // Try to fetch data from Videos table if it exists
    try {
      const [videos] = await sequelize.query("SELECT COUNT(*) as count FROM Videos");
      console.log("🎬 Videos count:", videos[0].count);
    } catch (error) {
      console.log("ℹ️  Videos table may not exist or is empty");
    }
    
    await sequelize.close();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
})();