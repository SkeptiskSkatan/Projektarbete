import { useState } from "react"
import "./runk.css";


export default function Login({ setUserId }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  async function login() {
    const res = await fetch("http://localhost:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage(data.detail || "Login failed")
      return
    }

    setUserId(data.user_id)
    setMessage("")
    setUsername("")
    setPassword("")
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        <input placeholder="Username" />
        <br />
        <input placeholder="Password" type="password" />
        <br />
        <button onClick={login}>Login</button>

        {message && <p>{message}</p>}
      </div>
    </div>
  )
}