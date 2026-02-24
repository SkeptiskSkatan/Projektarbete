import { useState } from "react"
import Login from "./login"
import Register from "./register"
import Feed from "./feed"
import Profile from "./profile"
import "./main.css"

function App() {
  const [userId, setUserId] = useState(null)
  const [showLogin, setShowLogin] = useState(true)
  const [view, setView] = useState("feed")
  const [selectedUserId, setSelectedUserId] = useState(null)

  // 🔥 styr popupen
  const [showWelcome, setShowWelcome] = useState(true)

  function logout() {
    setUserId(null)
    setView("feed")
    setSelectedUserId(null)
    setShowWelcome(true)
  }

  function openUserProfile(id) {
  if (id === userId) {
    setView("profile")
  } else {
    setSelectedUserId(id)
    setView("userProfile")
  }
}

  // ======================
  // NOT LOGGED IN
  // ======================
  if (!userId) {
    return (
      <>
        {showWelcome && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Welcome 👋</h2>
              <p>Please login or create an account to continue.</p>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  onClick={() => {
                    setShowLogin(true)
                    setShowWelcome(false)
                  }}
                >
                  Login
                </button>

                <button
                  onClick={() => {
                    setShowLogin(false)
                    setShowWelcome(false)
                  }}
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        )}

        {!showWelcome && (
          <div style={{ display: "flex", gap: "2rem" }}>
            {showLogin ? (
              <Login
                setUserId={setUserId}
                switchToRegister={() => setShowLogin(false)}
              />
            ) : (
              <Register
                switchToLogin={() => setShowLogin(true)}
              />
            )}
          </div>
        )}
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
      {view === "userProfile" && selectedUserId && (<Profile userId={selectedUserId} currentUserId={userId} />

)}
    </>
  )
}

export default App