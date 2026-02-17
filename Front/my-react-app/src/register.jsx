import { useState } from "react";
import "./main.css";

export default function Register({ switchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function register() {
    const res = await fetch("http://localhost:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.detail || "Registration failed");
      return;
    }
  switchToLogin(); // Om kontot skapades → gå direkt till login-sidan


    setMessage("Account created! You can now login.");
    setUsername("");
    setEmail("");
    setPassword("");
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      register(); // Trycker på register-knappen
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown} // Enter triggers register
        />
        <br />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown} // Enter triggers register
        />
        <br />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown} // Enter triggers register
        />
        <br />

        <button onClick={register}>Register</button>

        {message && <p>{message}</p>}

        <p>
          Already have an account?{" "}
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={switchToLogin}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}