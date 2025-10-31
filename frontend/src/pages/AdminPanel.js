import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ToastContainer";
import api from "../utils/api"; // Import the configured api instance
import CategoryManager from "../components/CategoryManager";
import ConfirmModal from "../components/ConfirmModal";
import "./AdminPanel.css";

const AdminPanel = () => {
  const { isAuthenticated, isAdmin, isOwner } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState("videos");
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [videoSearchTerm, setVideoSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
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

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && (isAdmin || isOwner)) {
      fetchStats();
      fetchCategories();
      if (activeTab === "videos") {
        fetchVideos();
      } else if (activeTab === "users") {
        fetchUsers();
      }
    } else if (isAuthenticated && !isAdmin && !isOwner) {
      setError("Admin access required. Please login with admin credentials.");
    } else if (!isAuthenticated) {
      setError("Please login to access admin panel.");
    }
  }, [
    activeTab,
    isAuthenticated,
    isAdmin,
    isOwner,
    fetchStats,
    fetchCategories,
    fetchVideos,
    fetchUsers,
  ]);

  const deleteVideo = useCallback(
    (videoId, videoTitle) => {
      setConfirmModal({
        isOpen: true,
        title: 'Delete Video',
        message: `Are you sure you want to delete "${videoTitle}"? This action cannot be undone.`,
        type: 'danger',
        onConfirm: async () => {
          try {
            await api.delete(`/admin/videos/${videoId}`);
            showSuccess("Video deleted successfully");
            fetchVideos();
            fetchStats();
            setConfirmModal({ isOpen: false });
          } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to delete video";
            showError(errorMsg);
            setConfirmModal({ isOpen: false });
          }
        }
      });
    },
    [fetchVideos, fetchStats, showSuccess, showError]
  );

  const deleteUser = useCallback(
    (username, displayName) => {
      setConfirmModal({
        isOpen: true,
        title: 'Delete User',
        message: `Are you sure you want to delete user "${displayName}" (@${username})? This action cannot be undone.`,
        type: 'danger',
        onConfirm: async () => {
          try {
            await api.delete(`/admin/users/${username}`);
            showSuccess("User deleted successfully");
            fetchUsers();
            fetchStats();
            setConfirmModal({ isOpen: false });
          } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to delete user";
            showError(errorMsg);
            setConfirmModal({ isOpen: false });
          }
        }
      });
    },
    [fetchUsers, fetchStats, showSuccess, showError]
  );

  const toggleAdminStatus = useCallback(
    (userId, currentStatus, userName) => {
      const action = currentStatus ? "Remove Admin Status" : "Make Admin";
      const message = currentStatus 
        ? `Are you sure you want to remove admin privileges from ${userName}?`
        : `Are you sure you want to grant admin privileges to ${userName}?`;
      
      setConfirmModal({
        isOpen: true,
        title: action,
        message,
        type: currentStatus ? 'warning' : 'success',
        onConfirm: async () => {
          try {
            await api.post(`/users/${userId}/toggle-admin`);
            showSuccess(currentStatus ? "Admin privileges removed successfully" : "User promoted to admin successfully");
            fetchUsers();
            setConfirmModal({ isOpen: false });
          } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to update admin status";
            showError(errorMsg);
            setConfirmModal({ isOpen: false });
          }
        }
      });
    },
    [fetchUsers, showSuccess, showError]
  );

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

  const updateVideo = useCallback(
    async (videoId) => {
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
    },
    [editForm, fetchVideos, fetchStats]
  );

  const noVideosMessage = useMemo(() => <p>No videos found</p>, []);

  const noUsersMessage = useMemo(() => <p>No users found</p>, []);

  // Filter videos based on search term
  const filteredVideos = useMemo(() => {
    if (!videoSearchTerm.trim()) return videos;
    const search = videoSearchTerm.toLowerCase();
    return videos.filter(video => 
      video.title?.toLowerCase().includes(search) ||
      video.description?.toLowerCase().includes(search) ||
      video.category?.toLowerCase().includes(search)
    );
  }, [videos, videoSearchTerm]);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return users;
    const search = userSearchTerm.toLowerCase();
    return users.filter(user =>
      user.firstname?.toLowerCase().includes(search) ||
      user.lastname?.toLowerCase().includes(search) ||
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  }, [users, userSearchTerm]);

  if (!isAuthenticated) {
    return (
      <div className="admin-panel">
        <div className="admin-container">
          <div className="error">Please login to access admin panel</div>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isOwner) {
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
          <h1>
            🎛️ Admin Control Panel
            <span className="mini-stat">🎬 {stats.totalVideos}</span>
          </h1>
          <Link to="/upload" className="upload-link">
            ➕ Upload New Video
          </Link>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="admin-tabs">
          <button
            className={`tab ${activeTab === "videos" ? "active" : ""}`}
            onClick={() => setActiveTab("videos")}
          >
            Manage Videos
          </button>
          <button
            className={`tab ${activeTab === "categories" ? "active" : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            Manage Categories
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
              <div className="section-header">
                <h2>Videos Management</h2>
                <input
                  type="text"
                  placeholder="🔍 Search videos by title, description, or category..."
                  value={videoSearchTerm}
                  onChange={(e) => setVideoSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              {videos.length === 0 ? (
                noVideosMessage
              ) : filteredVideos.length === 0 ? (
                <p>No videos match your search</p>
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
                      {filteredVideos.map((video) => (
                        <tr key={video.id}>
                          <td>
                            <img
                              src={
                                video.thumbnailFileUrl ||
                                video.thumbnail ||
                                "/placeholder-thumbnail.jpg"
                              }
                              alt={video.title}
                              className="video-thumb"
                              loading="lazy"
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
                                {categories.length > 0 ? (
                                  categories.map((cat) => (
                                    <option key={cat.id} value={cat.slug}>
                                      {cat.name}
                                    </option>
                                  ))
                                ) : (
                                  <>
                                    <option value="movies">Movies</option>
                                    <option value="music">Music</option>
                                    <option value="dramas">Dramas</option>
                                    <option value="cartoons">Cartoons</option>
                                  </>
                                )}
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
                                <span className="toggle-label">Top Rated</span>
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
                                    onClick={() => deleteVideo(video.id, video.title)}
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

          {activeTab === "categories" && (
            <CategoryManager />
          )}

          {activeTab === "users" && !loading && (
            <div className="users-section">
              <div className="section-header">
                <h2>Users Management</h2>
                <input
                  type="text"
                  placeholder="🔍 Search users by name, username, or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              {users.length === 0 ? (
                noUsersMessage
              ) : filteredUsers.length === 0 ? (
                <p>No users match your search</p>
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
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            {user.avatar ? (
                              <div className="user-avatar">
                                <img 
                                  src={user.avatar} 
                                  alt={user.firstname || user.username}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = `<div class="default-avatar">${(user.firstname?.[0] || user.username?.[0] || 'U').toUpperCase()}</div>`;
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="default-avatar">
                                {(user.firstname?.[0] || user.username?.[0] || 'U').toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td>
                            {user.firstname} {user.lastname}
                          </td>
                          <td className="username-cell">@{user.username}</td>
                          <td className="email-cell">{user.email}</td>
                          <td>
                            <span
                              className={`admin-badge ${
                                user.isOwner ? "owner" : user.isAdmin ? "admin" : "user"
                              }`}
                            >
                              {user.isOwner ? "👑 Owner" : user.isAdmin ? "🛡️ Admin" : "👤 User"}
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
                              {isOwner && !user.isOwner && (
                                <button
                                  onClick={() => toggleAdminStatus(user.id, user.isAdmin, `${user.firstname} ${user.lastname}`)}
                                  className={user.isAdmin ? "remove-admin-btn" : "make-admin-btn"}
                                  title={user.isAdmin ? "Remove Admin" : "Make Admin"}
                                >
                                  {user.isAdmin ? "⬇️ Remove Admin" : "⬆️ Make Admin"}
                                </button>
                              )}
                              {!user.isAdmin && (
                                <button
                                  onClick={() => deleteUser(user.username, `${user.firstname} ${user.lastname}`)}
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
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
        confirmText={confirmModal.type === 'danger' ? 'Delete' : confirmModal.type === 'warning' ? 'Remove' : 'Confirm'}
        cancelText="Cancel"
      />
    </div>
  );
};

export default React.memo(AdminPanel);
