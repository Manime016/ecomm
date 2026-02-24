import { useState, useEffect, useRef } from "react";
import "../styles/Settings.css";

function Settings() {
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { sender: "admin", text: "Hello! How can I help you?" }
  ]);

  const [activeTheme, setActiveTheme] = useState("light");

  const chatEndRef = useRef(null);

  /* ============================= */
  /* THEMES LIST */
  /* ============================= */

  const themes = [
    "light",
    "dark",
    "teal",
    "purple",
    "orange",
    "gold"
  ];

  /* ============================= */
  /* APPLY SAVED THEME ON LOAD */
  /* ============================= */

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);
  }, []);

  /* ============================= */
  /* AUTO SCROLL CHAT */
  /* ============================= */

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  /* ============================= */
  /* ESC TO CLOSE CHAT */
  /* ============================= */

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowChat(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  /* ============================= */
  /* APPLY THEME */
  /* ============================= */

  const applyTheme = (theme) => {
    themes.forEach((t) => document.body.classList.remove(t));
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
    setActiveTheme(theme);
  };

  /* ============================= */
  /* CHAT SEND */
  /* ============================= */

  const sendMessage = () => {
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: message }
    ]);

    setMessage("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "admin",
          text: "Thanks! Our team will get back to you."
        }
      ]);
    }, 1000);
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      {/* ABOUT */}
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

      {/* THEME SECTION */}
      <div className="settings-card">
        <h3>Theme</h3>

        <div className="theme-options">
          {themes.map((theme) => (
            <div
              key={theme}
              className={`theme-circle ${theme} ${
                activeTheme === theme ? "active-theme-circle" : ""
              }`}
              onClick={() => applyTheme(theme)}
              title={theme}
            />
          ))}
        </div>
      </div>

      {/* CHAT MODAL */}
      {showChat && (
        <div
          className="chat-overlay"
          onClick={() => setShowChat(false)}
        >
          <div
            className="chat-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chat-header">
              <h4>Live Support</h4>
              <button onClick={() => setShowChat(false)}>X</button>
            </div>

            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-message ${msg.sender}`}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && sendMessage()
                }
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;