import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useStarred } from "../contexts/StarredContext";
import api from "../utils/api"; // Import the configured api instance
import VideoCard from "../components/VideoCard"; // Import VideoCard component
import "./Profile.css";

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const { starredVideos } = useStarred();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("info");
  const [watchedVideos, setWatchedVideos] = useState([]);
  const [likedVideos, setLikedVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check for tab parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get("tab");
    if (
      tabParam &&
      ["info", "watched", "liked", "starred"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [location]);

  const fetchWatchedVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/history");
      setWatchedVideos(response.data.data || []);
    } catch (error) {
      // Silently handle error to avoid console pollution
      setWatchedVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLikedVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/likedVideos");
      setLikedVideos(response.data.data || []);
    } catch (error) {
      // Silently handle error to avoid console pollution
      setLikedVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    if (activeTab === "watched") {
      await fetchWatchedVideos();
    } else if (activeTab === "liked") {
      await fetchLikedVideos();
    }
  }, [activeTab, fetchWatchedVideos, fetchLikedVideos]);

  useEffect(() => {
    if (isAuthenticated) {
      // Load both watched and liked videos on initial load for statistics
      fetchWatchedVideos();
      fetchLikedVideos();
      // Also fetch when tab changes
      fetchUserData();
    }
  }, [
    isAuthenticated,
    activeTab,
    fetchWatchedVideos,
    fetchLikedVideos,
    fetchUserData,
  ]);

  const noContentMessage = useMemo(() => {
    switch (activeTab) {
      case "watched":
        return (
          <div className="no-content">
            <p>You haven't watched any movies yet.</p>
            <p>Start exploring our movie collection!</p>
          </div>
        );
      case "liked":
        return (
          <div className="no-content">
            <p>You haven't liked any movies yet.</p>
            <p>Like movies you enjoy to see them here!</p>
          </div>
        );
      case "starred":
        return (
          <div className="no-content">
            <p>No movies in your watch later list.</p>
            <p>Click the star ⭐ on any video to add it here!</p>
          </div>
        );
      default:
        return null;
    }
  }, [activeTab]);

  if (!isAuthenticated) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="error">Please login to view profile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M4 21v-2a4 4 0 0 1 3-3.87"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="profile-info">
            <h1>{user?.username}</h1>
            <p className="profile-name">
              {user?.firstname} {user?.lastname}
            </p>
            <p className="profile-email">{user?.email}</p>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            Profile Info
          </button>
          <button
            className={`tab ${activeTab === "watched" ? "active" : ""}`}
            onClick={() => setActiveTab("watched")}
          >
            Movies Watched
          </button>
          <button
            className={`tab ${activeTab === "liked" ? "active" : ""}`}
            onClick={() => setActiveTab("liked")}
          >
            Movies Liked
          </button>
          <button
            className={`tab ${activeTab === "starred" ? "active" : ""}`}
            onClick={() => setActiveTab("starred")}
          >
            ⭐ Watch Later
          </button>
        </div>

        <div className="profile-content">
          {activeTab === "info" && (
            <div className="profile-info-section">
              <div className="info-card">
                <h3>Personal Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>First Name:</label>
                    <span>{user?.firstname || "Not provided"}</span>
                  </div>
                  <div className="info-item">
                    <label>Last Name:</label>
                    <span>{user?.lastname || "Not provided"}</span>
                  </div>
                  <div className="info-item">
                    <label>Username:</label>
                    <span>{user?.username || "Not provided"}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{user?.email || "Not provided"}</span>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h3>Movie Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-number">{watchedVideos.length}</div>
                    <div className="stat-label">Movies Watched</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{likedVideos.length}</div>
                    <div className="stat-label">Movies Liked</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{starredVideos.length}</div>
                    <div className="stat-label">Watch Later</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "watched" && (
            <div className="movies-section">
              <h3>Movies Watched</h3>
              {loading ? (
                <div className="loading">Loading watched movies...</div>
              ) : watchedVideos.length > 0 ? (
                <div className="movies-grid">
                  {watchedVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              ) : (
                noContentMessage
              )}
            </div>
          )}

          {activeTab === "liked" && (
            <div className="movies-section">
              <h3>Movies Liked</h3>
              {loading ? (
                <div className="loading">Loading liked movies...</div>
              ) : likedVideos.length > 0 ? (
                <div className="movies-grid">
                  {likedVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              ) : (
                noContentMessage
              )}
            </div>
          )}

          {activeTab === "starred" && (
            <div className="movies-section">
              <h3>⭐ Watch Later</h3>
              {starredVideos.length > 0 ? (
                <div className="movies-grid">
                  {starredVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              ) : (
                noContentMessage
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Profile);
