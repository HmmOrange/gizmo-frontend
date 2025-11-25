import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState(null);
  const [bookmarks, setBookmarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
    if (token) {
      fetchBookmarks();
    }
  }, []);

  const fetchStats = async () => {
    try {
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${BACKEND_URL}/api/dashboard/stats`, { headers });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/dashboard/bookmarks`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      const data = await res.json();
      setBookmarks(data);
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    }
  };

  const StatCard = ({ title, allTime, last24h }) => (
    <div className="stat-card">
      <h3>{title}</h3>
      <div className="stat-values">
        <div className="stat-value">
          <span className="label">All Time</span>
          <span className="number">{allTime || 0}</span>
        </div>
        <div className="stat-value">
          <span className="label">Last 24h</span>
          <span className="number">{last24h || 0}</span>
        </div>
      </div>
    </div>
  );

  const BookmarkItem = ({ item, type }) => {
    const handleClick = () => {
      if (type === "paste") {
        navigate(`/share/${item.slug}`);
      } else if (type === "image") {
        navigate(`/share/image/${item.slug}`);
      } else if (type === "album") {
        navigate(`/share/album/${item.slug}`);
      }
    };

    return (
      <div className="bookmark-item" onClick={handleClick}>
        {type === "image" && (
          <img src={item.imageUrl} alt={item.caption} className="bookmark-thumbnail" />
        )}
        <div className="bookmark-info">
          <h4>{item.title || item.name || item.caption || "Untitled"}</h4>
          <p className="bookmark-type">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
          {item.description && <p className="bookmark-desc">{item.description}</p>}
          <small>
            Bookmarked: {new Date(item.bookmarkedAt).toLocaleDateString()}
          </small>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="dashboard-container"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Global statistics and your bookmarks</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Global Stats Section */}
      <section className="stats-section">
        <h2>Global Statistics</h2>
        <div className="stats-grid">
          {stats && (
            <>
              <StatCard title="Pastes" allTime={stats.pastes.allTime} last24h={stats.pastes.last24h} />
              <StatCard title="Images" allTime={stats.images.allTime} last24h={stats.images.last24h} />
              <StatCard title="Albums" allTime={stats.albums.allTime} last24h={stats.albums.last24h} />
              <StatCard title="Views" allTime={stats.views.allTime} last24h={stats.views.last24h} />
              <StatCard title="Bookmarks" allTime={stats.bookmarks.allTime} last24h={stats.bookmarks.last24h} />
              <div className="stat-card">
                <h3>Users</h3>
                <div className="stat-values">
                  <div className="stat-value">
                    <span className="label">Total</span>
                    <span className="number">{stats.users.total || 0}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* User Bookmarks Section */}
      {token && (
        <section className="bookmarks-section">
          <h2>Your Bookmarks</h2>

          {!bookmarks ? (
            <div className="loading">Loading bookmarks...</div>
          ) : (
            <div className="bookmarks-tabs">
              {/* Pastes */}
              {bookmarks.pastes && bookmarks.pastes.length > 0 && (
                <div className="bookmarks-category">
                  <h3>📝 Pastes ({bookmarks.pastes.length})</h3>
                  <div className="bookmarks-list">
                    {bookmarks.pastes.map((paste) => (
                      <BookmarkItem key={paste.slug} item={paste} type="paste" />
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {bookmarks.images && bookmarks.images.length > 0 && (
                <div className="bookmarks-category">
                  <h3>🖼️ Images ({bookmarks.images.length})</h3>
                  <div className="bookmarks-list">
                    {bookmarks.images.map((image) => (
                      <BookmarkItem key={image._id} item={image} type="image" />
                    ))}
                  </div>
                </div>
              )}

              {/* Albums */}
              {bookmarks.albums && bookmarks.albums.length > 0 && (
                <div className="bookmarks-category">
                  <h3>📚 Albums ({bookmarks.albums.length})</h3>
                  <div className="bookmarks-list">
                    {bookmarks.albums.map((album) => (
                      <BookmarkItem key={album._id} item={album} type="album" />
                    ))}
                  </div>
                </div>
              )}

              {!bookmarks.pastes?.length && !bookmarks.images?.length && !bookmarks.albums?.length && (
                <p className="no-bookmarks">No bookmarks yet. Start bookmarking content!</p>
              )}
            </div>
          )}
        </section>
      )}

      {!token && (
        <section className="login-prompt">
          <p>Sign in to view your bookmarks</p>
          <button onClick={() => navigate("/login")} className="login-button">
            Go to Login
          </button>
        </section>
      )}
    </div>
  );
}
