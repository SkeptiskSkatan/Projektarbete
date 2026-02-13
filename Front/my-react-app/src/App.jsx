import { useState } from "react"
import Login from "./login"
import Register from "./register"
import Feed from "./feed"
import Profile from "./profile"

function App() {
  const [userId, setUserId] = useState(null)
  const [showLogin, setShowLogin] = useState(true)
  const [view, setView] = useState("feed")

  function logout() {
    setUserId(null)
    setView("feed")
  }

  // NOT LOGGED IN
  if (!userId) {
    return (
      <>
        <div style={{ display: "flex", gap: "2rem" }}>
          {showLogin ? (
            <Login setUserId={setUserId} />
          ) : (
            <Register />
          )}
        </div>

        <button onClick={() => setShowLogin(!showLogin)}>
          {showLogin
            ? "Register"
            : "Login"}
        </button>
      </>
    )
  }

  // LOGGED IN
  return (
    <>
      <nav style={{ marginBottom: "1rem" }}>
        <button onClick={() => setView("feed")}>Feed</button>
        <button onClick={() => setView("profile")}>Profile</button>
        <button onClick={logout}>Logout</button>
      </nav>

      {view === "feed" && <Feed userId={userId} />}
      {view === "profile" && <Profile userId={userId} />}
    </>
  )
}

export default App