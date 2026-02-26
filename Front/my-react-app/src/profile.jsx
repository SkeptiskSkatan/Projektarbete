import { useEffect, useState } from "react"
import "./main.css";

export default function Profile({ userId, currentUserId, openUserProfile }) {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentInput, setCommentInput] = useState("")
  const [isFollowing, setIsFollowing] = useState(false)
  const [stats, setStats] = useState({ followers_count: 0, following_count: 0 })
  

  // ✅ NYTT
  const [listModal, setListModal] = useState(null)
  const [userList, setUserList] = useState([])

  useEffect(() => {
    if (!userId) return

    fetch(`http://localhost:8000/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
      .catch(err => console.error(err))

    fetch(`http://localhost:8000/users/${userId}/posts`)
      .then(res => res.json())
      .then(setPosts)
      .catch(err => console.error(err))

    fetch(`http://localhost:8000/users/${userId}/follow_stats`)
      .then(res => res.json())
      .then(setStats)

    if (currentUserId && userId !== currentUserId) {
      fetch(`http://localhost:8000/is_following/${currentUserId}/${userId}`)
        .then(res => res.json())
        .then(data => setIsFollowing(data.is_following))
    }
  }, [userId, currentUserId])

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

  // ✅ NYTT – open follower list
  async function openList(type) {
    const res = await fetch(
      `http://localhost:8000/users/${userId}/${type}`
    )
    const data = await res.json()
    setUserList(data)
    setListModal(type)
  }

  function closeList() {
    setListModal(null)
    setUserList([])
  }

  if (!user) return <p>Loading profile...</p>

  return (
    <>
      <h2>Profile</h2>
      <p><b>Username:</b> {user.username}</p>
      <p><b>Joined:</b> {new Date(user.created_at).toLocaleDateString()}</p>

      {/* Stats Display */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "10px" }}>
        <span 
          style={{ cursor: "pointer" }}
          onClick={() => openList("followers")}
        >
          <b>{stats.followers_count}</b> Followers
        </span>

        <span 
          style={{ cursor: "pointer" }}
          onClick={() => openList("following")}
        >
          <b>{stats.following_count}</b> Following
        </span>
      </div>

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
        <div key={p.id} className="post">
          <div className="post-header">
            <b 
              onClick={(e) => { 
                e.stopPropagation(); 
                openUserProfile(p.user_id); 
              }}
            >
              {p.username}
            </b>
          </div>

          <div onClick={() => openPost(p)} className="post-content">
            {p.content}
          </div>

          <div className="post-like">
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              Like
            </button>
          </div>
        </div>
      ))}

      {/* Post Modal */}
      {selectedPost && (
        <div className="overlayStyle" onClick={closeModal}>
          <div className="modalStyle" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal}>X</button>

            <h3>{selectedPost.username}</h3>
            <p>{selectedPost.content}</p>

            <hr />

            <h4>Comments</h4>
            <div>
              {comments.map((c, i) => (
                <p key={i}>
                  <b>{c.username}</b>: {c.content}
                </p>
              ))}
            </div>

            <div style={{ marginTop: "15px" }}>
              <input
                placeholder="Comment"
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
              />
              <button onClick={createComment}>Comment</button>
            </div>
          </div>
        </div>
      )}



      {/* ✅ NYTT – Followers/Following Modal */}
      {listModal && (
        <div className="overlayStyle" onClick={closeList}>
          <div className="modalStyle" onClick={e => e.stopPropagation()}>
            <button onClick={closeList}>X</button>

            <h3>
              {listModal === "followers"
                ? "Followers"
                : "Following"}
            </h3>

            {userList.length === 0 && <p>No users found</p>}

            {userList.map((u) => (
              <p
                key={u.id}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  closeList()
                  openUserProfile(u.id)
                }}
              >
                {u.username}
              </p>
            ))}
          </div>
        </div>
      )}

    </>
  )
}


