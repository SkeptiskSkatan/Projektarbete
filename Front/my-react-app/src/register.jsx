import { useState } from "react"

export default function Register() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  async function register() {
    const response = await fetch("http://localhost:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password
      })
    })
<<<<<<< HEAD
    setUsername("")
    setPassword("")
  }



return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
=======

    const data = await response.json()

    if (!response.ok) {
      setMessage(data.detail || "Something went wrong")
      return
    }

    setMessage("User created")
    setUsername("")
    setEmail("")
    setPassword("")
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>

>>>>>>> name
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
<<<<<<< HEAD
=======

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

>>>>>>> name
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
<<<<<<< HEAD
        <button type="submit" onClick={register}>Register</button>
=======

        <button onClick={register}>Register</button>

        {message && <p>{message}</p>}
>>>>>>> name
      </div>
    </div>
  )
}