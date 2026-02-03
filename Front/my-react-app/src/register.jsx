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
  }

return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        <input placeholder="Username" />
        <input placeholder="Password" type="password" />
        <button onClick={register}>Register</button>
      </div>
    </div>
  )
}
