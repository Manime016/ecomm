import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../styles/Settings.css";

function Settings() {
  const { t, i18n } = useTranslation();

  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { sender: "admin", text: t("settings.chatGreeting") }
  ]);

  const [activeTheme, setActiveTheme] = useState("light");

  const chatEndRef = useRef(null);

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
  /* APPLY THEME */
  /* ============================= */

  const applyTheme = (theme) => {
    themes.forEach((t) => document.body.classList.remove(t));
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
    setActiveTheme(theme);
  };

  /* ============================= */
  /* CHANGE LANGUAGE */
  /* ============================= */

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
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
          text: t("settings.chatReply")
        }
      ]);
    }, 1000);
  };

  return (
    <div className="settings-container">

      <h2>{t("settings.title")}</h2>

      {/* ABOUT */}
      <div className="settings-card">
        <h3>{t("settings.about")}</h3>
        <p>{t("settings.aboutText")}</p>
      </div>

      {/* LANGUAGE SECTION */}
      <div className="settings-card">
        <h3>{t("settings.language")}</h3>

        <select
          className="language-dropdown"
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="kn">Kannada</option>
          <option value="ta">Tamil</option>
          <option value="te">Telugu</option>
        </select>
      </div>

      {/* CHAT SUPPORT */}
      <div className="settings-card">
        <h3>{t("settings.chatSupport")}</h3>
        <button
          className="settings-btn"
          onClick={() => setShowChat(true)}
        >
          {t("settings.contactSupport")}
        </button>
      </div>

      {/* THEME SECTION */}
      <div className="settings-card">
        <h3>{t("settings.theme")}</h3>

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
              <h4>{t("settings.liveSupport")}</h4>
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
                placeholder={t("settings.typeMessage")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && sendMessage()
                }
              />
              <button onClick={sendMessage}>
                {t("settings.send")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Settings;