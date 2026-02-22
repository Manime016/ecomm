import { useState } from "react";
import "./Auth.css";

function Auth() {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const reset = () => {
    setError("");
    setMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    reset();

    try {

      /* LOGIN */
      if (mode === "login") {
        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) return setError(data.message);

        localStorage.setItem("token", data.token);
        setMsg("Login Successful ✅");
      }

      /* REGISTER */
      if (mode === "register") {
        if (password !== confirm)
          return setError("Passwords do not match");

        const res = await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) return setError(data.message);

        setMsg("Registered Successfully ✅");
        setMode("login");
      }

      /* FORGOT */
      if (mode === "forgot") {
        const res = await fetch("http://localhost:5000/api/auth/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) return setError(data.message);

        setMsg("Reset link sent 📩");
      }

    } catch {
      setError("Server Error ❌");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        <h2>{mode.toUpperCase()}</h2>

        {error && <p className="err">{error}</p>}
        {msg && <p className="ok">{msg}</p>}

        <form onSubmit={handleSubmit}>

          {mode === "register" && (
            <input
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          )}

          <input
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          {mode !== "forgot" && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          )}

          {mode === "register" && (
            <input
              type="password"
              placeholder="Confirm"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          )}

          <button>
            {mode === "login" && "Login"}
            {mode === "register" && "Register"}
            {mode === "forgot" && "Send"}
          </button>

        </form>

        <div className="links">

          {mode === "login" && (
            <>
              <p onClick={() => setMode("register")}>Register</p>
              <p onClick={() => setMode("forgot")}>Forgot?</p>
            </>
          )}

          {mode !== "login" && (
            <p onClick={() => setMode("login")}>Back to Login</p>
          )}

        </div>

      </div>
    </div>
  );
}

export default Auth;
