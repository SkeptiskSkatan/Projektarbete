import { useEffect, useState } from "react"

export default function Profile({ userId }) {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])

  useEffect(() => {
    fetch(`http://localhost:8000/users/${userId}`)
      .then(res => res.json())
      .then(setUser)

    fetch(`http://localhost:8000/users/${userId}/posts`)
      .then(res => res.json())
      .then(setPosts)
  }, [userId])

  if (!user) return <p>Loading profile...</p>

  return (
    <>
      <h2>Profile</h2>

      <p><b>Username:</b> {user.username}</p>
      <p><b>Email:</b> {user.email}</p>
      <p><b>Joined:</b> {new Date(user.created_at).toLocaleDateString()}</p>

      <h3>Posts ({posts.length})</h3>

      {posts.map((p, i) => (
        <p key={i}>{p.content}</p>
      ))}
    </>
  )
}
