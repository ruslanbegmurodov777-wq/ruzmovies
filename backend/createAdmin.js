import { User } from "./src/sequelize.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: './.env' });

// Create admin user
(async () => {
  try {
    console.log("Creating admin user...");
    
    const adminExists = await User.findOne({
      where: { email: "admin@movie.com" },
    });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      // Use ADMIN_PASSWORD from environment variables, default to 'admin123' if not set
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      await User.create({
        firstname: "Admin",
        lastname: "User",
        username: "admin",
        email: "admin@movie.com",
        password: hashedPassword,
        isAdmin: true,
      });

      console.log(`✅ Admin user created (admin@movie.com / ${adminPassword})`);
    } else {
      console.log("✅ Admin user already exists");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  }
})();