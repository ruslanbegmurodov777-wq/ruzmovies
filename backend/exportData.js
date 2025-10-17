import { Sequelize, DataTypes } from "sequelize";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use SQLite for local database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

// Models
import UserModel from "./src/models/User.js";
import VideoModel from "./src/models/Video.js";
import VideoLikeModel from "./src/models/VideoLike.js";
import CommentModel from "./src/models/Comment.js";
import SubscriptionModel from "./src/models/Subscription.js";
import ViewModel from "./src/models/View.js";

const User = UserModel(sequelize, DataTypes);
const Video = VideoModel(sequelize, DataTypes);
const VideoLike = VideoLikeModel(sequelize, DataTypes);
const Comment = CommentModel(sequelize, DataTypes);
const Subscription = SubscriptionModel(sequelize, DataTypes);
const View = ViewModel(sequelize, DataTypes);

// Export data to JSON files
(async () => {
  try {
    console.log("🚀 Exporting data from local SQLite database...");
    
    // Test connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
    
    // Fetch all data from each table
    const users = await User.findAll();
    const videos = await Video.findAll();
    const videoLikes = await VideoLike.findAll();
    const comments = await Comment.findAll();
    const subscriptions = await Subscription.findAll();
    const views = await View.findAll();
    
    // Convert to JSON
    const data = {
      users: users.map(user => user.toJSON()),
      videos: videos.map(video => video.toJSON()),
      videoLikes: videoLikes.map(like => like.toJSON()),
      comments: comments.map(comment => comment.toJSON()),
      subscriptions: subscriptions.map(sub => sub.toJSON()),
      views: views.map(view => view.toJSON())
    };
    
    // Write to file
    fs.writeFileSync('exported_data.json', JSON.stringify(data, null, 2));
    console.log("✅ Data exported successfully to exported_data.json");
    
    // Close database connection
    await sequelize.close();
  } catch (error) {
    console.error("❌ Error exporting data:", error.message);
  }
})();