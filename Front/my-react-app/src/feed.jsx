import { useEffect, useState } from "react"

export default function Feed({ userId }) {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState("")
  const [message, setMessage] = useState("")

  async function fetchPosts() {
    const res = await fetch("http://localhost:8000/posts")
    const data = await res.json()
    setPosts(data)
  }

  async function createPost() {
    if (!content.trim()) return
    if (!userId) {
      setMessage("You must be logged in to post")
      return
    }

    const res = await fetch("http://localhost:8000/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        user_id: userId
      })
    })

    if (!res.ok) {
      setMessage("Could not create post")
      return
    }

    setContent("")
    setMessage("")
    fetchPosts()
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault()
      createPost()
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  return (
    <>
      <h2>Feed</h2>

      <input
        placeholder="Det"
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button onClick={createPost}>Post</button>

      {message && <p>{message}</p>}

      {posts.map((p, i) => (
        <p key={i}>
          <b>{p.username}</b>: {p.content}
        </p>
      ))}
    </>
  )
}