import { useState } from "react"
import Login from "./Login"
import Register from "./Register"
import Feed from "./feed"

function App() {
  const [userId, setUserId] = useState(null)

  if (!userId) {
    return (
      <>
        <Login setUserId={setUserId} />
        <Register />
      </>
    )
  }

  return <Feed userId={userId} />
}

export default App
