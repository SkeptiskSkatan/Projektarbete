import { useEffect, useState } from "react"
import "./main.css"

export default function Feed({ userId, viewProfile }) {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState("")
  const [message, setMessage] = useState("")

  async function fetchPosts() {
    const res = await fetch(`http://localhost:8000/posts?user_id=${userId}`)
    const data = await res.json()
    setPosts(data)
  }

  async function createPost() {
    if (!content.trim()) return
    if (!userId) {
      setMessage("You must be logged in to post")
      return
    }
    await fetch("http://localhost:8000/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, user_id: userId })
    })
    setContent("")
    setMessage("")
    fetchPosts()
  }

  async function toggleLike(postId) {
    await fetch("http://localhost:8000/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, post_id: postId })
    })
    fetchPosts() // uppdatera likes
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  return (
    <>
      <h2>Feed</h2>

      <input
        placeholder="Write something..."
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={e => e.key === "Enter" && createPost()}
      />
      <button onClick={createPost}>Post</button>
      {message && <p>{message}</p>}

      {posts.map(p => (
        <div key={p.id} className="post">
          <b style={{ cursor: "pointer" }} onClick={() => viewProfile(p.user_id)}>
            {p.username}
          </b>: {p.content}

          <div style={{ marginTop: "5px" }}>
            {/* Hjärtat är grått om ej likeat, rött om likeat */}
            <span
              style={{
                cursor: "pointer",
                color: p.liked_by_user ? "red" : "lightgrey",
                fontSize: "18px",
                marginRight: "5px"
              }}
              onClick={() => toggleLike(p.id)}
            >
              ❤️
            </span>
            <span>{p.likes}</span>
          </div>
        </div>
      ))}
    </>
  )
}