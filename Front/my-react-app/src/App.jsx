import { useState } from "react"
import Login from "./login"
import Register from "./register"
import Feed from "./feed"
import Profile from "./profile"

function App() {
  const [userId, setUserId] = useState(null)
  const [showLogin, setShowLogin] = useState(true)
  const [view, setView] = useState("feed")
  const [selectedUserId, setSelectedUserId] = useState(null)

  function logout() {
    setUserId(null)
    setView("feed")
  }

function openUserProfile(id) {
  if (id === userId) {
    setView("profile")
  } else {
    setSelectedUserId(id)
    setView("userProfile")
  }
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
          {showLogin ? "Register" : "Login"}
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

      {view === "feed" && (
        <Feed userId={userId} openUserProfile={openUserProfile} />
      )}
      {view === "profile" && <Profile userId={userId} />}
      {view === "userProfile" && selectedUserId && (<Profile userId={selectedUserId} />
)}
    </>
  )
}

export default App
