import { useEffect, useState } from "react"

export default function Profile({ userId, currentUserId }) {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentInput, setCommentInput] = useState("")
  const [isFollowing, setIsFollowing] = useState(false)
  const [stats, setStats] = useState({ followers_count: 0, following_count: 0 })

  useEffect(() => {
    if (!userId) return

    // Fetch user info
    fetch(`http://localhost:8000/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
      .catch(err => console.error(err))

    // Fetch user's posts
    fetch(`http://localhost:8000/users/${userId}/posts`)
      .then(res => res.json())
      .then(setPosts)
      .catch(err => console.error(err))

    // Fetch Follow Stats
    fetch(`http://localhost:8000/users/${userId}/follow_stats`)
      .then(res => res.json())
      .then(setStats)

    // Check Follow Status
    if (currentUserId && userId !== currentUserId) {
      fetch(`http://localhost:8000/is_following/${currentUserId}/${userId}`)
        .then(res => res.json())
        .then(data => setIsFollowing(data.is_following))
    }
  }, [userId, currentUserId])

  // Follow Logic
  async function toggleFollow() {
    const endpoint = isFollowing ? "unfollow" : "follow"
    await fetch(`http://localhost:8000/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        follower_id: currentUserId, 
        following_id: userId 
      })
    })
    
    setIsFollowing(!isFollowing)
    const res = await fetch(`http://localhost:8000/users/${userId}/follow_stats`)
    const newStats = await res.json()
    setStats(newStats)
  }

  // Modal & Comment Logic
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
    if (!commentInput.trim() || !selectedPost) return

    await fetch("http://localhost:8000/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: commentInput,
        user_id: currentUserId, 
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
      <p><b>Joined:</b> {new Date(user.created_at).toLocaleDateString()}</p>

      {/* Stats Display */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "10px" }}>
        <span><b>{stats.followers_count}</b> Followers</span>
        <span><b>{stats.following_count}</b> Following</span>
      </div>

      {/* The follow button only shows when it is someone elses profile */}
      {currentUserId && userId !== currentUserId && (
        <button 
          onClick={toggleFollow}
          style={{ 
            backgroundColor: isFollowing ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            padding: "5px 15px",
            borderRadius: "5px",
            cursor: "pointer",
            marginBottom: "15px"
          }}
        >
          {isFollowing ? "Unfollow" : "Follow"}
        </button>
      )}

      <h3>Posts ({posts.length})</h3>

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
          {p.content}
        </div>
      ))}

      {/* Modal */}
      {selectedPost && (
        <div style={overlayStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} style={{ float: "right", cursor: "pointer" }}>X</button>
            <h3>{selectedPost.content}</h3>
            <hr />
            <h4>Comments</h4>
            {comments.length === 0 && <p>No comments yet</p>}
            {comments.map((c, i) => (
              <p key={i}><b>{c.username}</b>: {c.content}</p>
            ))}
            <input
              placeholder="Write a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              style={{ width: "100%", marginTop: "10px" }}
            />
            <button onClick={createComment} style={{ marginTop: "10px" }}>Comment</button>
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