import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { fetchVideos } from "../utils/api";
import VideoCard from "../components/VideoCard";
import "./Home.css";

const PAGE_SIZE = 12;

const Videos = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async (nextPage) => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    try {
      if (nextPage === 1) setInitialLoading(true);
      setLoading(true);
      const data = await fetchVideos({ page: nextPage, limit: PAGE_SIZE });
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

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  // Infinite scroll using IntersectionObserver (server-side pagination)
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        loadPage(page + 1);
      }
    }, { rootMargin: "600px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, loadPage]);

  const list = useMemo(() => items, [items]);

  if (initialLoading) return <div className="loading">Loading videos...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home">
      <div className="home-container">
        <div className="videos-grid">
          {list.map((v) => (
            v?.id ? <VideoCard key={v.id} video={v} /> : null
          ))}
        </div>
        <div ref={sentinelRef} style={{ height: 1 }} />
        {loading && <div className="loading" style={{ padding: 8 }}>Loading...</div>}
        {!hasMore && list.length > 0 && (
          <div className="end" style={{ padding: 8, opacity: 0.7 }}>No more videos</div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Videos);
