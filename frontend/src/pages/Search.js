import React, { useState, useEffect, useCallback, useRef } from "react";

import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api"; // Import the configured api instance
import VideoCard from "../components/VideoCard";
import "./Search.css";

const Search = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get("q") || "";
  const { isAuthenticated } = useAuth();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce timer ref to avoid firing requests on every keystroke
  const debounceRef = useRef(null);

  const performSearch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        `/videos/search?searchterm=${encodeURIComponent(searchTerm)}`
      );
      setVideos(response.data.data || []);
    } catch (error) {
      // Silence noisy errors in UI; log once for debugging
      setError("Failed to search videos");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    // Require minimal length to avoid expensive queries and noise
    if (!isAuthenticated) {
      setError("Please login to search videos");
      return;
    }
    if (!searchTerm || searchTerm.trim().length < 2) {
      setVideos([]);
      setError(null);
      return;
    }

    // Debounce actual request to reduce API spam while typing
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, isAuthenticated, performSearch]);

  if (!isAuthenticated) {
    return (
      <div className="search-page">
        <div className="search-container">
          <div className="error">Please login to search videos</div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      <div className="search-container">
        <h2 className="search-title">
          {searchTerm ? `Search results for "${searchTerm}"` : "Search Videos"}
        </h2>

        {loading && <div className="loading">Searching...</div>}

        {error && <div className="error">{error}</div>}

        {!loading && !error && videos.length === 0 && searchTerm && (
          <div className="no-results">
            <p>No videos found for "{searchTerm}"</p>
            <p>Try different keywords or check your spelling</p>
          </div>
        )}

        {!loading && videos.length > 0 && (
          <div className="search-results">
            <p className="results-count">{videos.length} video(s) found</p>
            <div className="videos-grid">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;