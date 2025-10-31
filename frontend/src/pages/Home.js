import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchVideos } from "../utils/api";
import { useStarred } from "../contexts/StarredContext";
import VideoCard from "../components/VideoCard";
import "./Home.css";

const PAGE_SIZE = 9;

const Home = () => {
  const { starredVideos } = useStarred();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([{ id: "all", label: "All", slug: "all" }]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);
  const categoryCache = useRef({});
  const mountedRef = useRef(false);

  // Get active category from URL params
  const categoryParam = searchParams.get('category');
  const activeCategory = categoryParam || "all";

  const loadPage = useCallback(async (nextPage, category) => {
    if (loadingRef.current) return;
    
    // Handle starred videos separately (from local state)
    if (category === 'starred') {
      setInitialLoading(true);
      setLoading(true);
      loadingRef.current = true;
      
      try {
        setItems(starredVideos);
        setHasMore(false); // No pagination for starred videos
        setPage(1);
        setError(null);
      } finally {
        setLoading(false);
        setInitialLoading(false);
        loadingRef.current = false;
      }
      return;
    }
    
    const cacheKey = `${category}_${nextPage}`;
    
    // Check cache first for instant loading
    if (categoryCache.current[cacheKey] && nextPage === 1) {
      setItems(categoryCache.current[cacheKey]);
      setHasMore(categoryCache.current[cacheKey].length === PAGE_SIZE);
      setPage(1);
      setInitialLoading(false);
      setLoading(false);
      // Still fetch in background to update cache
    }
    
    loadingRef.current = true;
    try {
      if (nextPage === 1 && !categoryCache.current[cacheKey]) setInitialLoading(true);
      setLoading(true);
      
      const data = await fetchVideos({ page: nextPage, limit: PAGE_SIZE, category });
      const list = Array.isArray(data) ? data : [];
      
      // Cache the first page of each category
      if (nextPage === 1) {
        categoryCache.current[cacheKey] = list;
      }
      
      setItems((prev) => (nextPage === 1 ? list : [...prev, ...list]));
      setHasMore(list.length === PAGE_SIZE);
      setPage(nextPage);
      setError(null);
    } catch (_e) {
      setError("Failed to load videos");
      if (nextPage === 1) setItems([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      loadingRef.current = false;
    }
  }, [starredVideos]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/v1/categories');
        const data = await response.json();
        if (data.success) {
          const allCategory = { id: "all", label: "All", slug: "all" };
          const dynamicCategories = data.data.map(cat => ({
            id: cat.slug,
            label: cat.name,
            slug: cat.slug
          }));
          const starredCategory = { id: "starred", label: "⭐ Starred", slug: "starred" };
          setCategories([allCategory, ...dynamicCategories, starredCategory]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Initial load
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      loadPage(1, activeCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset and reload when category changes
  useEffect(() => {
    if (!mountedRef.current) return;
    
    setHasMore(true);
    setPage(1);
    loadPage(1, activeCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  // Reload starred videos when starredVideos changes
  useEffect(() => {
    if (activeCategory === 'starred' && mountedRef.current) {
      setItems(starredVideos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starredVideos, activeCategory]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !loadingRef.current && hasMore) {
        loadPage(page + 1, activeCategory);
      }
    }, { rootMargin: "400px 0px", threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeCategory, hasMore, loading]);

  const handleCategoryChange = useCallback((slug) => {
    if (slug === "all") {
      navigate('/');
    } else {
      navigate(`/?category=${slug}`);
    }
  }, [navigate]);

  const noVideosMessage = useMemo(() => {
    if (activeCategory === "starred") {
      return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '3rem', margin: '0.5rem 0' }}>⭐</p>
          <p style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>No starred videos yet</p>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Click the star icon on any video to save it here for later!</p>
        </div>
      );
    }
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
          <h2 className="page-title">RuzTube</h2>

          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.slug ? "active" : ""}`}
                onClick={() => handleCategoryChange(category.slug)}
                aria-current={activeCategory === category.slug ? "page" : undefined}
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