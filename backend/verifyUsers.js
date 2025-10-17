import { Sequelize } from "sequelize";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: './.env' });

// Aiven MySQL configuration using environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME || 'defaultdb', // DB_NAME
  process.env.DB_USER || 'avnadmin', // DB_USER
  process.env.DB_PASS, // DB_PASS - required, no default for security
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

// Verify users and their passwords
(async () => {
  try {
    console.log("🚀 Connecting to Aiven MySQL database...");
    
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
    
    // Fetch all users with their passwords
    const [users] = await sequelize.query("SELECT id, firstname, lastname, username, email, password, isAdmin FROM Users");
    console.log("👥 Users in database:");
    
    for (const user of users) {
      console.log(`\n--- User: ${user.firstname} ${user.lastname} (${user.username}) ---`);
      console.log(`Email: ${user.email}`);
      console.log(`Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
      
      // Test password verification for common passwords from environment variables
      // If not set, use default test passwords
      const testPasswords = process.env.TEST_PASSWORDS ? 
        process.env.TEST_PASSWORDS.split(',') : 
        ['admin123', 'test123', 'password', '123456'];
      
      for (const testPassword of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(testPassword.trim(), user.password);
          if (isMatch) {
            console.log(`✅ Password matches: ${testPassword.trim()}`);
            break;
          }
        } catch (err) {
          // Ignore errors for password comparison
        }
      }
    }
    
    await sequelize.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
})();