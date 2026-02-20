import { useEffect, useState } from "react"
import "./main.css";

export default function Feed({ userId, openUserProfile }) {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState("")
  const [message, setMessage] = useState("")
  const [comments, setComments] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [commentInput, setCommentInput] = useState("")
  
  // Pagination states
  const [skip, setSkip] = useState(0) 
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 10

  /**
   * Fetches posts from the backend.
   * @param {boolean} isInitial - If true, resets the feed (used for first load or after posting).
   */
  async function fetchPosts(isInitial = false) {
    const currentSkip = isInitial ? 0 : skip
    
    try {
      const res = await fetch(`http://localhost:8000/posts?limit=${LIMIT}&skip=${currentSkip}`)
      const data = await res.json()

      if (isInitial) {
        setPosts(data)
        setSkip(LIMIT)
        setHasMore(data.length === LIMIT) // If we got exactly the limit, there might be more
      } else {
        setPosts(prev => [...prev, ...data])
        setSkip(prev => prev + LIMIT)
        
        // If the backend returns fewer items than requested, we've hit the end
        if (data.length < LIMIT) {
          setHasMore(false)
        }
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err)
    }
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
    // Reset the feed to show the new post at the top
    fetchPosts(true)
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
    fetchPosts(true)
  }, [])

  return (
    <>
      <h2>Feed</h2>

      <div style={{ marginBottom: "20px" }}>
        <input
          placeholder="Det"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <button onClick={createPost}>Post</button>
        {message && <p>{message}</p>}
      </div>

      {/* Post List */}
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
                // likePost(p.id); // Placeholder for your like function
              }}
            >
              Like
            </button>
          </div>
        </div>
      ))}

      {/* Load More Button */}
      {hasMore ? (
        <button 
          onClick={() => fetchPosts(false)} 
          style={{ 
            width: "100%", 
            padding: "10px", 
            margin: "20px 0", 
            cursor: "pointer" 
          }}
        >
          Load More
        </button>
      ) : (
        <p>No more posts to show.</p>
      )}

      {/* Modal for Post Details & Comments */}
      {selectedPost && (
        <div class="overlayStyle" onClick={closeModal}>
          <div class="modalStyle" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal}>
              X
            </button>

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
    </>
  )
}