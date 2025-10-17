import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchVideos } from "../utils/api"; // Import the fetchVideos function
import VideoCard from "../components/VideoCard";
import { useAuth } from "../contexts/AuthContext";
import "./Home.css";

const Home = () => {
  const { isAdmin } = useAuth();
  const [videos, setVideos] = useState([]); // Initialize with empty array
  const [filteredVideos, setFilteredVideos] = useState([]); // Initialize with empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = useMemo(
    () => [
      { id: "all", label: "All" },
      { id: "movies", label: "Movies" },
      { id: "music", label: "Music" },
      { id: "dramas", label: "Dramas" },
      { id: "cartoons", label: "Cartoons" },
    ],
    []
  );

  const fetchRecommendedVideos = useCallback(async () => {
    try {
      setLoading(true);
      const videosData = await fetchVideos();
      // Ensure videosData is an array before setting state
      setVideos(Array.isArray(videosData) ? videosData : []);
      setFilteredVideos(Array.isArray(videosData) ? videosData : []);
    } catch (error) {
      // Silently handle error to avoid console pollution
      setError("Failed to load videos");
      // Reset to empty arrays on error
      setVideos([]);
      setFilteredVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendedVideos();
  }, [fetchRecommendedVideos]);

  const filterVideosByCategory = useCallback(() => {
    // Ensure videos is an array before filtering
    const videosArray = Array.isArray(videos) ? videos : [];
    
    let filtered;
    if (activeCategory === "all") {
      filtered = videosArray;
    } else {
      filtered = videosArray.filter((video) => video && video.category === activeCategory);
    }

    // Ensure top-rated videos stay at the top even after filtering
    const sortedFiltered = [...filtered].sort((a, b) => {
      // Check if a and b are valid objects
      if (!a || !b) return 0;
      
      // First sort by featured (top-rated) status
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // Then sort by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setFilteredVideos(sortedFiltered);
  }, [videos, activeCategory]);

  useEffect(() => {
    filterVideosByCategory();
  }, [filterVideosByCategory]);

  const noVideosMessage = useMemo(() => {
    if (activeCategory === "all") {
      return <p>No videos available. Be the first to upload!</p>;
    }
    return (
      <p>
        No{" "}
        {categories.find((c) => c.id === activeCategory)?.label.toLowerCase()}{" "}
        found.
      </p>
    );
  }, [activeCategory, categories]);

  // Ensure filteredVideos is an array before accessing length
  const filteredVideosArray = Array.isArray(filteredVideos) ? filteredVideos : [];

  if (loading) {
    return <div className="loading">Loading videos...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="home">
      <div className="home-container">
        {isAdmin && (
          <div className="admin-dashboard">
            <h3>Admin Dashboard</h3>
            <div className="admin-stats">
              <div className="stat-card">
                <span className="stat-number">{Array.isArray(videos) ? videos.length : 0}</span>
                <span className="stat-label">Total Videos</span>
              </div>
            </div>
          </div>
        )}
        <div className="page-header">
          <h2 className="page-title">Ruzmovie</h2>

          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${
                  activeCategory === category.id ? "active" : ""
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {filteredVideosArray.length === 0 && !loading ? (
          <div className="no-videos">{noVideosMessage}</div>
        ) : (
          <div className="videos-grid">
            {filteredVideosArray.map((video) => (
              <VideoCard key={video && video.id ? video.id : Math.random()} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Home);