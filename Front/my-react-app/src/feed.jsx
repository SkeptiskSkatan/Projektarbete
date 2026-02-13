import { useEffect, useState } from "react"
import "./runk.css";


export default function Feed({ userId }) {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState("")

  async function fetchPosts() {
    const res = await fetch("http://localhost:8000/posts")
    const data = await res.json()
    setPosts(data)
  }

  async function createPost() {
    await fetch("http://localhost:8000/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, user_id: userId })
    })
    setContent("")
    fetchPosts()
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  return (
    <>
      <h2>Feed</h2>
      <input
        placeholder="KIM YONG UN I'M KIM YONG UN"
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <button onClick={createPost}>Post</button>

      {posts.map((p, i) => (
        <p key={i}><b>{p[1]}</b>: {p[0]}</p>
      ))}
    </>
  )
}
