import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Dashboard from "./pages/Home";
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

function App() {
  const isLoggedIn = !!localStorage.getItem("isLoggedIn");

  // Apply saved theme on load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.className = savedTheme;
  }, []);

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }) => {
    return isLoggedIn ? children : <Navigate to="/" replace />;
  };

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
                isLoggedIn ? <Navigate to="/dashboard" replace /> : <Auth />
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
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

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>

        </div>
      </div>
    </div>
  );
}

export default App;