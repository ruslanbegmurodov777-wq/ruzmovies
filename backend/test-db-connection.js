import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log("Testing database connection...\n");

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

let sequelize;

if (isDevelopment) {
  // Use SQLite for local development
  console.log("Using SQLite for local development");
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
  });
} else {
  // Use MySQL for production
  console.log("Using MySQL for production/remote database");
  sequelize = new Sequelize(
    process.env.DB_NAME || "movie",
    process.env.DB_USER || "root",
    process.env.DB_PASS || "ruslanbek777",
    {
      host: process.env.DB_HOST || "127.0.0.1",
      port: process.env.DB_PORT || 3306,
      dialect: process.env.DB_DIALECT || "mysql",
      logging: false,
      dialectOptions: {
        connectTimeout: 10000 // 10 seconds
      }
    }
  );
}

(async () => {
  try {
    if (isDevelopment) {
      console.log("SQLite database path:", path.join(__dirname, 'database.sqlite'));
    } else {
      console.log("Connection parameters:");
      console.log("- Host:", process.env.DB_HOST || "127.0.0.1");
      console.log("- Database:", process.env.DB_NAME || "movie");
      console.log("- User:", process.env.DB_USER || "root");
      console.log("- Port:", process.env.DB_PORT || 3306);
      console.log("- Dialect:", process.env.DB_DIALECT || "mysql");
    }
    console.log("");

    await sequelize.authenticate();
    console.log("✅ Connection successful!");
    
    // Test a simple query
    const [results] = await sequelize.query("SELECT 1+1 as test");
    console.log("✅ Query test successful:", results[0].test);
    
    await sequelize.close();
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    
    if (error.original) {
      console.error("- Code:", error.original.code);
      console.error("- Errno:", error.original.errno);
      console.error("- Syscall:", error.original.syscall);
    }
    
    console.log("\n🔧 Troubleshooting tips:");
    console.log("1. Ensure your database server is running");
    console.log("2. Check if the database credentials are correct");
    console.log("3. Verify network connectivity to the database host");
    console.log("4. Check firewall settings");
    
    if (process.env.DB_HOST && process.env.DB_HOST.includes('railway.app')) {
      console.log("\n📝 For Railway deployment:");
      console.log("  - Ensure your Railway database is online");
      console.log("  - Check if there are any network restrictions");
      console.log("  - Verify the credentials in your .env file");
      console.log("\n📝 For local development, you can use:");
      console.log("  DB_HOST=127.0.0.1");
      console.log("  DB_NAME=movie");
      console.log("  DB_USER=root");
      console.log("  DB_PASS=ruslanbek777");
    }
  }
})();