import { useEffect, useState } from "react"
import "./main.css";

export default function Feed({ userId }) {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState("")
  const [message, setMessage] = useState("")
  const [comments, setComments] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [commentInput, setCommentInput] = useState("")

  async function fetchPosts() {
    const res = await fetch("http://localhost:8000/posts")
    const data = await res.json()
    setPosts(data)
  }

  async function fetchComments(postId) {
    const res = await fetch(`http://localhost:8000/posts/${postId}/comments`)
    const data = await res.json()
    setComments(data)
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
      body: JSON.stringify({
        content,
        user_id: userId
      })
    })

    setContent("")
    fetchPosts()
  }

  async function createComment() {
    if (!commentInput.trim()) return

    await fetch("http://localhost:8000/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: commentInput,
        user_id: userId,
        post_id: selectedPost.id
      })
    })

    setCommentInput("")
    fetchComments(selectedPost.id)
  }

  function openPost(post) {
    setSelectedPost(post)
    fetchComments(post.id)
  }

  function closeModal() {
    setSelectedPost(null)
    setComments([])
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
      />

      <button onClick={createPost}>Post</button>

      {message && <p>{message}</p>}

      {posts.map((p) => (
        <div
          key={p.id}
          onClick={() => openPost(p)}
          style={{
            border: "1px solid gray",
            padding: "10px",
            margin: "10px 0",
            cursor: "pointer"
          }}
        >
          <b>{p.username}</b>: {p.content}
        </div>
      ))}

      {selectedPost && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <button onClick={closeModal} style={{ float: "right" }}>
              X
            </button>

            <h3>{selectedPost.username}</h3>
            <p>{selectedPost.content}</p>

            <hr />

            <h4>Comments</h4>

            {comments.map((c, i) => (
              <p key={i}>
                <b>{c.username}</b>: {c.content}
              </p>
            ))}

            <input
              placeholder="Write a comment..."
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
            />

            <button onClick={createComment}>
              Comment
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
}

const modalStyle = {
  backgroundColor: "white",
  padding: "20px",
  width: "400px",
  borderRadius: "10px"
}
