import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StarredProvider } from "./contexts/StarredContext";
import { ToastProvider } from "./components/ToastContainer";
import "./App.css";
import "./styles/darkTheme.css";
const Header = lazy(() => import("./components/Header"));
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VideoWatch = lazy(() => import("./pages/VideoWatch"));
const Search = lazy(() => import("./pages/Search"));
const Profile = lazy(() => import("./pages/Profile"));
const Upload = lazy(() => import("./pages/Upload"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Videos = lazy(() => import("./pages/Videos"));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <StarredProvider>
            <Router>
            <div className="App">
              <Suspense fallback={<div style={{padding:"1rem"}}>Loading...</div>}>
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
                    <Route path="/videos" element={<Videos />} />
                  </Routes>
                </main>
              </Suspense>
            </div>
          </Router>
        </StarredProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;