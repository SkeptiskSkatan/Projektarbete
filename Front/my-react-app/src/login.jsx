import { useState } from "react";
import "./main.css";

export default function Login({ setUserId, switchToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function login() {
    const res = await fetch("http://localhost:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.detail || "Login failed");
      return;
    }

    setUserId(data.user_id);
    setMessage("");
    setUsername("");
    setPassword("");
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      login(); // Trycker på login-knappen
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown} // Enter triggers login
        />
        <br />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown} // Enter triggers login
        />
        <br />

        <button onClick={login}>Login</button>

        {message && <p>{message}</p>}

        <p>
          Don't have an account?{" "}
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={switchToRegister}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}