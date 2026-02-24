import { useState, useEffect, useRef } from "react";
import "../styles/Settings.css";

function Settings() {
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { sender: "admin", text: "Hello! How can I help you?" }
  ]);

  const chatEndRef = useRef(null);

  // Apply saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);
  }, []);

  // Auto scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowChat(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const applyTheme = (theme) => {
    document.body.classList.remove("light", "dark", "teal");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessages = [
      ...messages,
      { sender: "user", text: message }
    ];

    setMessages(newMessages);
    setMessage("");

    // Simulated admin reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "admin", text: "Thanks! Our team will get back to you." }
      ]);
    }, 1000);
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      <div className="settings-card">
        <h3>About</h3>
        <p>
          Shop111 is your complete e-commerce platform.
          Fast. Secure. Reliable.
        </p>
      </div>

      <div className="settings-card">
        <h3>Chat Support</h3>
        <button
          className="settings-btn"
          onClick={() => setShowChat(true)}
        >
          Contact Support
        </button>
      </div>

      <div className="settings-card">
        <h3>Theme</h3>

        <div className="theme-options">
          <button onClick={() => applyTheme("light")}>Light</button>
          <button onClick={() => applyTheme("dark")}>Dark</button>
          <button onClick={() => applyTheme("teal")}>Teal</button>
        </div>
      </div>

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