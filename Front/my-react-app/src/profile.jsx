import { useEffect, useState } from "react"

export default function Profile({ userId }) {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentInput, setCommentInput] = useState("")

  useEffect(() => {
    fetch(`http://localhost:8000/users/${userId}`)
      .then(res => res.json())
      .then(setUser)

    fetch(`http://localhost:8000/users/${userId}/posts`)
      .then(res => res.json())
      .then(setPosts)
  }, [userId])

    async function fetchComments(postId) {
    const res = await fetch(`http://localhost:8000/posts/${postId}/comments`)
    const data = await res.json()
    setComments(data)
  }

  function openPost(post) {
    setSelectedPost(post)
    fetchComments(post.id)
  }

  function closeModal() {
    setSelectedPost(null)
    setComments([])
    setCommentInput("")
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

  if (!user) return <p>Loading profile...</p>

  return (
    <>
      <h2>Profile</h2>

      <p><b>Username:</b> {user.username}</p>
      <p><b>Email:</b> {user.email}</p>
      <p><b>Joined:</b> {new Date(user.created_at).toLocaleDateString()}</p>

      <h3>Posts ({posts.length})</h3>

       {posts.map((p) => (
        <div
          key={p.id}
          onClick={(e) => {
            e.stopPropagation()
            openPost(p)
          }}
          style={{
            border: "1px solid gray",
            padding: "10px",
            margin: "10px 0",
            cursor: "pointer"
          }}
        >
          {p.content}
        </div>
      ))}

      {/* MODAL RENDERED LAST AND FULLY ISOLATED */}
      {selectedPost !== null && (
        <div
          style={overlayStyle}
          onClick={closeModal}
        >
          <div
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              style={{ float: "right", cursor: "pointer" }}
            >
              X
            </button>

            <h3>{selectedPost.content}</h3>

            <hr />

            <h4>Comments</h4>

            {comments.length === 0 && <p>No comments yet</p>}

            {comments.map((c, i) => (
              <p key={i}>
                <b>{c.username}</b>: {c.content}
              </p>
            ))}

            <input
              placeholder="Write a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              style={{ width: "100%", marginTop: "10px" }}
            />

            <button
              onClick={createComment}
              style={{ marginTop: "10px" }}
            >
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
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999
}

const modalStyle = {
  backgroundColor: "white",
  padding: "20px",
  width: "450px",
  borderRadius: "12px",
  maxHeight: "80vh",
  overflowY: "auto"
}