import { useEffect, useState } from "react"

export default function Feed({ userId }) {
  // Local state: posts from the server + current input text
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState("")

  // Fetch all posts from the backend
  async function fetchPosts() {
    const res = await fetch("http://localhost:8000/posts")
    const data = await res.json()
    setPosts(data)
  }

  // Create a new post, then refresh the feed
  async function createPost() {
    await fetch("http://localhost:8000/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, user_id: userId })
    })
    setContent("")
    fetchPosts()
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault()
      createPost()
    }
  }

  // Run once on mount to load the initial posts
  useEffect(() => {
    fetchPosts()
  }, [])


  return (
    <>
      <h2>Feed</h2>
      {/* Controlled input: value comes from state, onChange updates state */}
      <input
        placeholder="Det"
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button onClick={createPost}>Post</button>



{/* Render each post */}
{posts.map((p, i) => (
  <p key={i}>
    <b>{p.username}</b>: {p.content}
  </p>

))}
    </>
  )
}
