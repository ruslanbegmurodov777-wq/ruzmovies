import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Sequelize } from "sequelize";

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

// Detect Aiven MySQL (ssl required)
const isAiven = process.env.DB_HOST?.includes("aivencloud.com");

console.log("Is Aiven:", isAiven);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: console.log,

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

    // Test a simple query
    const [results] = await sequelize.query("SELECT 1 as test");
    console.log("✅ Simple query test passed:", results);

    await sequelize.close();
    console.log("✅ Database connection closed.");
  } catch (error) {
    console.error("❌ Unable to connect to database:", error.message);
    console.error("Error code:", error.original?.code);
    console.error("Error errno:", error.original?.errno);
    console.error("Error syscall:", error.original?.syscall);
  }
})();