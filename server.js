import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import app from "./backend/src/server.js";
import { sequelize } from "./backend/src/sequelize.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

// Serve React build in production only
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "frontend", "build");
  const indexHtml = path.join(frontendPath, "index.html");

  if (fs.existsSync(indexHtml)) {
    console.log(`🧩 Serving frontend from: ${frontendPath}`);
    app.use(express.static(frontendPath));

    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).json({ message: "API endpoint not found" });
      }
    });
  } else {
    console.warn(
      "⚠️ frontend/build/index.html not found. Did you run 'npm run build'?",
      { indexHtml }
    );
  }
}

const PORT = process.env.PORT || 5000;

// Start server after DB check
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
  }

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
})();
