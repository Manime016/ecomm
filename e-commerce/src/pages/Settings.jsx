import { useState, useEffect } from "react";
import "../styles/Settings.css";

function Settings() {
  const [showChat, setShowChat] = useState(false);

  // Apply saved theme on load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme) => {
    document.body.classList.remove("light", "dark", "teal");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      {/* ABOUT SECTION */}
      <div className="settings-card">
        <h3>About</h3>
        <p>
          Shop111 is your complete e-commerce platform.
          Fast. Secure. Reliable.
        </p>
      </div>

      {/* CHAT SUPPORT */}
      <div className="settings-card">
        <h3>Chat Support</h3>
        <button
          className="settings-btn"
          onClick={() => setShowChat(true)}
        >
          Contact Support
        </button>
      </div>

      {/* THEME OPTIONS */}
      <div className="settings-card">
        <h3>Theme</h3>

        <div className="theme-options">
          <button onClick={() => applyTheme("light")}>
            Light
          </button>

          <button onClick={() => applyTheme("dark")}>
            Dark
          </button>

          <button onClick={() => applyTheme("teal")}>
            Teal
          </button>
        </div>
      </div>

      {/* CHAT MODAL */}
      {showChat && (
        <div className="chat-overlay">
          <div className="chat-box">
            <div className="chat-header">
              <h4>Live Support</h4>
              <button onClick={() => setShowChat(false)}>X</button>
            </div>

            <div className="chat-messages">
              <p><strong>Admin:</strong> Hello! How can I help you?</p>
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="Type your message..."
              />
              <button>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;