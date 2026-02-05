import { useState } from "react"

export default function Register() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  async function register() {
    await fetch("http://localhost:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
    setUsername("")
    setPassword("")
  }



return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" onClick={register}>Register</button>
      </div>
    </div>
  )
}
