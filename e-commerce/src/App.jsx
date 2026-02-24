import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

// Auth
import Auth from "./components/auth";

// Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/sidebar";

// Styles
import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () =>
      window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.classList.remove("light", "dark", "teal");
    document.body.classList.add(savedTheme);
  }, []);

  return (
    <div className="app-container">

      {isLoggedIn && <Navbar />}

      <div className="main-layout">

        {isLoggedIn && <Sidebar />}

        <div className="content">

          <Routes>

            {/* Login */}
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Auth />
                )
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <Search />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>

        </div>
      </div>
    </div>
  );
}

export default App;