import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";
import "./Header.css";
import profilesvg from "../img/profile.svg";
import homeIcon from "../img/home-button.png";

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  }, [navigate, searchTerm]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  }, [logout, navigate]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Close menu when clicking outside - optimized with useCallback
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1 className="logo-text">Ruzmovie</h1>
          <div className="home-icon">
            <img
              src={homeIcon}
              alt="home"
              style={{ width: "25px", height: "25px" }}
            />
          </div>
        </Link>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>

        <nav className="nav">
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <>
                  <span className="admin-badge">ADMIN</span>
                  <Link to="/admin" className="nav-link admin-link">
                    Admin Panel
                  </Link>
                </>
              )}
              <Link to="/profile" className="nav-link profile-link">
                Profile
              </Link>

              <button onClick={handleLogout} className="nav-link logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link">
                Register
              </Link>
            </>
          )}
        </nav>

        <div className="header-right">
          <div className="desktop-theme-toggle">
            <ThemeToggle />
          </div>
          <button className="mobile-menu-toggle" onClick={toggleMenu}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <nav
          ref={menuRef}
          className={`mobile-nav ${isMenuOpen ? "nav-open" : ""}`}
        >
          <div className="nav-content">
            <div className="mobile-theme-toggle">
              <span className="theme-icon sun-icon">☀️</span>
              <ThemeToggle />
              <span className="theme-icon moon-icon">🌙</span>
            </div>
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <>
                    <span className="admin-badge">ADMIN</span>
                    <Link
                      to="/admin"
                      className="nav-link admin-link"
                      onClick={closeMenu}
                    >
                      Admin Panel
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  className="nav-link profile-link"
                  onClick={closeMenu}
                >
                  Profile
                </Link>
                <Link
                  to="/profile?tab=watched"
                  className="nav-link history-link"
                  onClick={closeMenu}
                >
                  History
                </Link>
                <Link
                  to="/profile?tab=starred"
                  className="nav-link starred-link"
                  onClick={closeMenu}
                >
                  ⭐ Watch Later
                </Link>

                <button onClick={handleLogout} className="nav-link logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link" onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/register" className="nav-link" onClick={closeMenu}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default React.memo(Header);