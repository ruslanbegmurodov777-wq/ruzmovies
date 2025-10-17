import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getVideoType } from "../utils/videoUtils";
import api from "../utils/api"; // Import the configured api instance
import "./AdminPanel.css";

const AdminPanel = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("videos");
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVideos: 0,
    totalViews: 0,
  });
  const [editingVideo, setEditingVideo] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    url: "",
    thumbnail: "",
    featured: true,
    category: "movies",
  });

  const fetchStats = useCallback(async () => {
    try {
      const [videosRes, usersRes] = await Promise.all([
        api.get("/admin/videos"),
        api.get("/admin/users"),
      ]);

      // Calculate total views from all videos
      const videos = videosRes.data.data || [];
      const totalViews = videos.reduce(
        (sum, video) => sum + (video.views || 0),
        0
      );

      setStats({
        totalUsers: usersRes.data.data?.length || 0,
        totalVideos: videos.length || 0,
        totalViews: totalViews,
      });
    } catch (error) {
      // Silently handle error for stats, just keep default values
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/videos");
      setVideos(response.data.data || []);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        `Failed to fetch videos: ${error.message}`;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/users");
      setUsers(response.data.data || []);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        `Failed to fetch users: ${error.message}`;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchStats();
      if (activeTab === "videos") {
        fetchVideos();
      } else if (activeTab === "users") {
        fetchUsers();
      }
    } else if (isAuthenticated && !isAdmin) {
      setError("Admin access required. Please login with admin credentials.");
    } else if (!isAuthenticated) {
      setError("Please login to access admin panel.");
    }
  }, [activeTab, isAuthenticated, isAdmin, fetchStats, fetchVideos, fetchUsers]);

  const deleteVideo = useCallback(async (videoId) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        await api.delete(`/admin/videos/${videoId}`);
        setSuccess("Video deleted successfully");
        fetchVideos(); // Refresh the list
        fetchStats(); // Update stats
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        const errorMsg =
          error.response?.data?.message || "Failed to delete video";
        setError(errorMsg);
      }
    }
  }, [fetchVideos, fetchStats]);

  const deleteUser = useCallback(async (username) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/admin/users/${username}`);
        setSuccess("User deleted successfully");
        fetchUsers(); // Refresh the list
        fetchStats(); // Update stats
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        const errorMsg =
          error.response?.data?.message || "Failed to delete user";
        setError(errorMsg);
      }
    }
  }, [fetchUsers, fetchStats]);

  const startEditVideo = useCallback((video) => {
    setEditingVideo(video.id);
    setEditForm({
      title: video.title,
      description: video.description || "",
      url: video.url,
      thumbnail: video.thumbnail,
      featured: video.featured !== undefined ? video.featured : true,
      category: video.category || "movies",
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingVideo(null);
    setEditForm({
      title: "",
      description: "",
      url: "",
      thumbnail: "",
      featured: true,
      category: "movies",
    });
  }, []);

  const updateVideo = useCallback(async (videoId) => {
    try {
      await api.put(`/admin/videos/${videoId}`, editForm);
      setSuccess("Video updated successfully");
      setEditingVideo(null);
      fetchVideos(); // Refresh the list
      fetchStats(); // Update stats
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to update video";
      setError(errorMsg);
    }
  }, [editForm, fetchVideos, fetchStats]);

  const noVideosMessage = useMemo(() => (
    <p>No videos found</p>
  ), []);

  const noUsersMessage = useMemo(() => (
    <p>No users found</p>
  ), []);

  if (!isAuthenticated) {
    return (
      <div className="admin-panel">
        <div className="admin-container">
          <div className="error">Please login to access admin panel</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="admin-container">
          <div className="error">Admin access required</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel card-ocean-effect">
      <div className="admin-container">
        <div className="admin-header">
          <h1>🎛️ Admin Control Panel</h1>
          <Link to="/upload" className="upload-link">
            ➕ Upload New Video
          </Link>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Stats Dashboard */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎬</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalVideos}</div>
              <div className="stat-label">Total Videos</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👁️</div>
            <div className="stat-content">
              <div className="stat-number">{stats.totalViews}</div>
              <div className="stat-label">Total Views</div>
            </div>
          </div>
        </div>

        <div className="admin-tabs">
          <button
            className={`tab ${activeTab === "videos" ? "active" : ""}`}
            onClick={() => setActiveTab("videos")}
          >
            Manage Videos
          </button>
          <button
            className={`tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Manage Users
          </button>
        </div>

        <div className="admin-content">
          {loading && <div className="loading">Loading...</div>}

          {activeTab === "videos" && !loading && (
            <div className="videos-section">
              <h2>Videos Management</h2>
              {videos.length === 0 ? (
                noVideosMessage
              ) : (
                <div className="videos-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Thumbnail</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Views</th>
                        <th>Description</th>
                        <th>Top Rated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {videos.map((video) => (
                        <tr key={video.id}>
                          <td>
                            <img
                              src={video.thumbnailFileUrl ? `${api.defaults.baseURL}${video.thumbnailFileUrl}` : video.thumbnail || "/placeholder-thumbnail.jpg"}
                              alt={video.title}
                              className="video-thumb"
                              onError={(e) => {
                                e.target.src = "/placeholder-thumbnail.jpg";
                              }}
                            />
                          </td>
                          <td className="video-title-cell">
                            {editingVideo === video.id ? (
                              <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    title: e.target.value,
                                  })
                                }
                                className="edit-input"
                              />
                            ) : (
                              video.title
                            )}
                          </td>
                          <td className="category-cell">
                            {editingVideo === video.id ? (
                              <select
                                value={editForm.category}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    category: e.target.value,
                                  })
                                }
                                className="edit-select"
                              >
                                <option value="movies">Movies</option>
                                <option value="music">Music</option>
                                <option value="dramas">Dramas</option>
                                <option value="cartoons">Cartoons</option>
                              </select>
                            ) : (
                              <span
                                className={`category-badge ${
                                  video.category || "movies"
                                }`}
                              >
                                {(video.category || "movies")
                                  .charAt(0)
                                  .toUpperCase() +
                                  (video.category || "movies").slice(1)}
                              </span>
                            )}
                          </td>
                          <td>{video.views || 0} views</td>
                          <td className="description-cell">
                            {editingVideo === video.id ? (
                              <textarea
                                value={editForm.description}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    description: e.target.value,
                                  })
                                }
                                className="edit-textarea"
                                rows="2"
                              />
                            ) : video.description ? (
                              `${video.description.substring(0, 50)}${
                                video.description.length > 50 ? "..." : ""
                              }`
                            ) : (
                              "No description"
                            )}
                          </td>
                          <td className="featured-cell">
                            {editingVideo === video.id ? (
                              <label className="featured-toggle">
                                <input
                                  type="checkbox"
                                  checked={editForm.featured}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      featured: e.target.checked,
                                    })
                                  }
                                />
                                <span className="toggle-slider"></span>
                                Top Rated
                              </label>
                            ) : (
                              <span
                                className={`featured-badge ${
                                  video.featured ? "featured" : "not-featured"
                                }`}
                              >
                                {video.featured ? "🏆 Top Rated" : "📋 Regular"}
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              {editingVideo === video.id ? (
                                <>
                                  <button
                                    onClick={() => updateVideo(video.id)}
                                    className="save-btn"
                                    title="Save Changes"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="cancel-btn"
                                    title="Cancel Edit"
                                  >
                                    ✗
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditVideo(video)}
                                    className="edit-btn"
                                    title="Edit Video"
                                  >
                                    ✎️
                                  </button>
                                  <Link
                                    to={`/video/${video.id}`}
                                    className="view-btn"
                                    title="View Video"
                                  >
                                    👁️
                                  </Link>
                                  <button
                                    onClick={() => deleteVideo(video.id)}
                                    className="delete-btn"
                                    title="Delete Video"
                                  >
                                    🗑️
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && !loading && (
            <div className="users-section">
              <h2>Users Management</h2>
              {users.length === 0 ? (
                noUsersMessage
              ) : (
                <div className="users-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Avatar</th>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Admin</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="user-avatar">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.username} />
                              ) : (
                                <div className="default-avatar">
                                  {user.username?.[0]?.toUpperCase()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {user.firstname} {user.lastname}
                          </td>
                          <td className="username-cell">@{user.username}</td>
                          <td className="email-cell">{user.email}</td>
                          <td>
                            <span
                              className={`admin-badge ${
                                user.isAdmin ? "admin" : "user"
                              }`}
                            >
                              {user.isAdmin ? "🛡️ Admin" : "👤 User"}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Link
                                to={`/profile/${user.id}`}
                                className="view-btn"
                                title="View Profile"
                              >
                                👁️
                              </Link>
                              {!user.isAdmin && (
                                <button
                                  onClick={() => deleteUser(user.username)}
                                  className="delete-btn"
                                  title="Delete User"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(AdminPanel);