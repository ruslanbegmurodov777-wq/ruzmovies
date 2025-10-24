import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { fetchVideos } from "../utils/api";
import VideoCard from "../components/VideoCard";
import "./Home.css";

const PAGE_SIZE = 9;

const Home = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

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

  const loadPage = useCallback(async (nextPage, category) => {
    if (loadingRef.current || (!hasMore && nextPage !== 1)) return;
    loadingRef.current = true;
    try {
      if (nextPage === 1) setInitialLoading(true);
      setLoading(true);
      const data = await fetchVideos({ page: nextPage, limit: PAGE_SIZE, category });
      const list = Array.isArray(data) ? data : [];
      setItems((prev) => (nextPage === 1 ? list : [...prev, ...list]));
      setHasMore(list.length === PAGE_SIZE);
      setPage(nextPage);
    } catch (_e) {
      setError("Failed to load videos");
      if (nextPage === 1) setItems([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      loadingRef.current = false;
    }
  }, [hasMore]);

  // Initial load
  useEffect(() => {
    loadPage(1, activeCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset and reload when category changes
  useEffect(() => {
    setItems([]);
    setHasMore(true);
    setPage(1);
    loadPage(1, activeCategory);
  }, [activeCategory, loadPage]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        loadPage(page + 1, activeCategory);
      }
    }, { rootMargin: "600px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, activeCategory, loadPage]);

  const noVideosMessage = useMemo(() => {
    if (activeCategory === "all") return <p>No videos available. Be the first to upload!</p>;
    const label = categories.find((c) => c.id === activeCategory)?.label.toLowerCase();
    return <p>No {label} found.</p>;
  }, [activeCategory, categories]);

  if (initialLoading) return <div className="loading">Loading videos...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home">
      <div className="home-container">
        <div className="page-header">
          <h2 className="page-title">Ruzmovie</h2>

          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? "active" : ""}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="no-videos">{noVideosMessage}</div>
        ) : (
          <div className="videos-grid">
            {items.map((video) => (
              video?.id ? <VideoCard key={video.id} video={video} /> : null
            ))}
          </div>
        )}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {loading && <div className="loading" style={{ padding: 8 }}>Loading...</div>}
        {!hasMore && items.length > 0 && (
          <div className="end" style={{ padding: 8, opacity: 0.7 }}>No more videos</div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Home);