import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: './.env' });

// Production database configuration (Aiven MySQL) using environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME || 'defaultdb',
  process.env.DB_USER || 'avnadmin',
  process.env.DB_PASS, // Required - no default for security
  {
    host: process.env.DB_HOST || 'mysql-176744c3-ruzmovie.b.aivencloud.com',
    port: process.env.DB_PORT || 22011,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
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

// Test connection and fetch data
(async () => {
  try {
    console.log("🚀 Attempting to connect to Aiven MySQL database (Production Mode)...");
    console.log(`Host: ${process.env.DB_HOST || 'mysql-176744c3-ruzmovie.b.aivencloud.com'}`);
    console.log(`Database: ${process.env.DB_NAME || 'defaultdb'}`);
    console.log(`User: ${process.env.DB_USER || 'avnadmin'}`);
    
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
    
    // Try to fetch data from Users table
    try {
      const [users] = await sequelize.query("SELECT COUNT(*) as count FROM Users");
      console.log("👤 Users count:", users[0].count);
    } catch (error) {
      console.log("❌ Error fetching users:", error.message);
    }
    
    // Try to fetch data from Videos table
    try {
      const [videos] = await sequelize.query("SELECT COUNT(*) as count FROM Videos");
      console.log("🎬 Videos count:", videos[0].count);
    } catch (error) {
      console.log("❌ Error fetching videos:", error.message);
    }
    
    await sequelize.close();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
})();