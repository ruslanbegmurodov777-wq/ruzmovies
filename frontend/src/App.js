import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StarredProvider } from "./contexts/StarredContext";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VideoWatch from "./pages/VideoWatch";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import Upload from "./pages/Upload";
import AdminPanel from "./pages/AdminPanel";
import "./App.css";
import "./styles/darkTheme.css";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StarredProvider>
          <Router>
            <div className="App">
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/video/:id" element={<VideoWatch />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/upload" element={<Upload />} />
                </Routes>
              </main>
            </div>
          </Router>
        </StarredProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
