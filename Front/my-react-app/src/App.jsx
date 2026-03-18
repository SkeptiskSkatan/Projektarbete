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
  const [showPostModal, setShowPostModal] = useState(false)
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
              <h2>Welcome </h2>
              <p>Please login or create an account to continue.</p>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", justifyContent: "center" }}>
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
          <div style={{ display: "flex", gap: "2rem", justifyContent: "center", padding: "20px" }}>
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

  // ======================
  // LOGGED IN
  // ======================
  return (
    <>
      <div className="sidebar">
        <button onClick={() => setView("feed")}> Feed</button>
        <button onClick={() => setView("profile")}> Profile</button>
        <button onClick={() => setShowPostModal(true)}> Post</button>
        <button onClick={logout}> Logout</button>
      </div>

      <div className="layout">
        <div className="main-content">
          {view === "feed" && (
            <Feed
              userId={userId}
              openUserProfile={openUserProfile}
              showPostModal={showPostModal}
              setShowPostModal={setShowPostModal}
            />
          )}
          {view === "profile" && (
            <Profile userId={userId} currentUserId={userId} openUserProfile={openUserProfile} />
          )}
          {view === "userProfile" && selectedUserId && (
            <Profile userId={selectedUserId} currentUserId={userId} openUserProfile={openUserProfile} />
          )}
        </div>
      </div>
    </>
  )
}

export default App
