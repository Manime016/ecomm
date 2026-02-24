import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

// Images
import img1 from "../assets/ads/img.jpg";
import img2 from "../assets/ads/img2.jpg";
import img3 from "../assets/ads/img3.jpg";
import img4 from "../assets/ads/img4.jpg";
import img5 from "../assets/ads/img5.jpg";

const API = `${import.meta.env.VITE_API_URL}/api/auth`;

function Auth() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  /* SLIDER */
  const slides = [img1, img2, img3, img4, img5];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const resetMessages = () => {
    setError("");
    setMessage("");
  };

  /* SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      /* LOGIN */
      if (mode === "login") {
        const res = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setLoading(false);
          return setError(data.message || "Login failed");
        }

        // Save auth data
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("username", data.user.name);
        localStorage.setItem("isLoggedIn", "true");

        setMessage("Login Successful ✅");

        // Small delay prevents race condition in production
        setTimeout(() => {
          navigate("/Home", { replace: true });
        }, 150);
      }

      /* REGISTER */
      else if (mode === "register") {
        if (password !== confirmPassword) {
          setLoading(false);
          return setError("Passwords do not match");
        }

        const res = await fetch(`${API}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setLoading(false);
          return setError(data.message || "Registration failed");
        }

        setMessage("Registration Successful ✅");
        setMode("login");
      }

      /* FORGOT */
      else if (mode === "forgot") {
        const res = await fetch(`${API}/forgot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
          setLoading(false);
          return setError(data.message || "Request failed");
        }

        setMessage("Reset link sent 📩");
      }

    } catch (err) {
      setError("Server error ❌");
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-main-box">

        {/* LEFT SIDE */}
        <div className="auth-left">

          <h2 className="auth-title">
            {mode === "login" && "LOGIN"}
            {mode === "register" && "REGISTER"}
            {mode === "forgot" && "FORGOT PASSWORD"}
          </h2>

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

          <form onSubmit={handleSubmit}>

            {mode === "register" && (
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {mode !== "forgot" && (
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}

            {mode === "register" && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
              />
            )}

            <button type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Login"
                : mode === "register"
                ? "Register"
                : "Send Link"}
            </button>

          </form>

          <div className="auth-links">

            {mode === "login" && (
              <>
                <p onClick={() => setMode("register")}>
                  Create account
                </p>
                <p onClick={() => setMode("forgot")}>
                  Forgot password?
                </p>
              </>
            )}

            {mode !== "login" && (
              <p onClick={() => setMode("login")}>
                Back to login
              </p>
            )}

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div
          className="auth-right slider"
          style={{
            backgroundImage: `url(${slides[currentSlide]})`,
          }}
        >
          <div className="slider-overlay">
            <h1>Shoppp 111</h1>
            <p>
              Everything in hand<br />
              ONE PLACE FOR ALL
            </p>
            <div className="ad-box">
              <p>BUY NOW</p>
              <p>✔ Easy</p>
              <p>✔ Simple</p>
              <p>✔ Fast</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Auth;