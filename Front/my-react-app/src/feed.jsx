import { useEffect, useState, useRef, useCallback } from "react";
import "./main.css";

function Post({ p, userId, openUserProfile, openPost }) {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/posts/${p.id}/likes/${userId}`)
      .then(res => res.json())
      .then(data => {
        setLikes(data.likes_count);
        setLiked(data.liked);
      });
  }, [p.id, userId]);

  async function toggleLike(e) {
    e.stopPropagation();

    const url = liked
      ? "http://localhost:8000/unlike"
      : "http://localhost:8000/like";

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, post_id: p.id }),
    });

    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  }

  const formattedDate =
    new Date(p.created_at).toLocaleDateString("sv-SE") +
    " kl. " +
    new Date(p.created_at).toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="post">
      <div className="post-header">
        <span
          className="username-link"
          onClick={(e) => {
            e.stopPropagation();
            openUserProfile(p.user_id);
          }}
        >
          {p.username}
        </span>
        <div className="post-date">{formattedDate}</div>
      </div>

      <div onClick={() => openPost(p)} className="post-content">
        {p.content}

  {p.image_data && (
    <img
      src={p.image_data}
      alt="post"
      style={{
        width: "100%",
        marginTop: "10px",
        borderRadius: "8px",
      }}
    />
  )}
</div>

      {/* ❤️ Likes display */}
      <div style={{ marginTop: "8px", fontSize: "16px" }}>
        {liked ? "❤️" : "🤍"} {likes}
      </div>

      {/* Buttons row */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "8px",
        }}
      >
        <button onClick={toggleLike}>
          {liked ? "Dislike" : "Like"}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            openPost(p);
          }}
        >
          Comment
        </button>
      </div>
    </div>
  );
}

export default function Feed({ userId, logout, openUserProfile }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedType, setFeedType] = useState("all");
  const limit = 10;

  const observer = useRef();

  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadPosts(skip);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, skip, feedType]
  );

  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");

  useEffect(() => {
    loadPosts(0);
  }, [feedType]);

  async function loadPosts(newSkip) {
    if (loading) return;

    setLoading(true);

    const url =
      feedType === "all"
        ? `http://localhost:8000/posts?limit=${limit}&skip=${newSkip}`
        : `http://localhost:8000/posts/following?user_id=${userId}&limit=${limit}&skip=${newSkip}`;

    const res = await fetch(url);
    const data = await res.json();

    if (newSkip === 0) {
      setPosts(data);
    } else {
      setPosts((prev) => [...prev, ...data]);
    }

    setSkip(newSkip + limit);
    setLoading(false);
  }

    async function createPost() {
    if (!content.trim() && !image) return;

    let base64String = null;
    if (image) {
      base64String = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(image); // Convert file to Base64
      });
    }

    await fetch("http://localhost:8000/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        content, 
        user_id: userId, 
        image_data: base64String // 2. Send to backend
      }),
    });

    setContent("");
    setImage(null); // 3. Reset input
    loadPosts(0);
  }

  async function fetchComments(postId) {
    const res = await fetch(`http://localhost:8000/posts/${postId}/comments`);
    const data = await res.json();
    setComments(data);
  }

  function openPost(post) {
    setSelectedPost(post);
    fetchComments(post.id);
  }

  function closeModal() {
    setSelectedPost(null);
    setComments([]);
    setCommentInput("");
  }

  async function createComment() {
    if (!commentInput.trim()) return;

    await fetch("http://localhost:8000/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: commentInput,
        user_id: userId,
        post_id: selectedPost.id,
      }),
    });

    setCommentInput("");
    fetchComments(selectedPost.id);
  }

  // 🔥 DELETE FUNCTION (WORKS FOR MODAL)
async function deletePost() {
  if (!selectedPost) return;

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this post?"
  );
  if (!confirmDelete) return;

  // Skicka user_id som path-param
  const res = await fetch(
    `http://localhost:8000/posts/${selectedPost.id}/${userId}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    alert("Could not delete post. Make sure you are the owner.");
    return;
  }

  // Ta bort från frontend
  setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));

  // Stäng modal
  closeModal();
}

  return (
    <div className="feed-container">
      <h2>Feed</h2>

      <div style={{ marginBottom: "15px" }}>
        <button
          onClick={() => {
            setFeedType("all");
            setSkip(0);
          }}
          style={{
            marginRight: "10px",
            fontWeight: feedType === "all" ? "bold" : "normal",
          }}
        >
          All Feed
        </button>

        <button
          onClick={() => {
            setFeedType("following");
            setSkip(0);
          }}
          style={{
            fontWeight: feedType === "following" ? "bold" : "normal",
          }}
        >
          Following Feed
        </button>
      </div> 
      
{feedType === "all" && (
  <div style={{ marginBottom: "15px" }}>
    <textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      placeholder="Write something..."
      rows="3"
      style={{ width: "100%", padding: "8px", borderRadius: "5px" }}
    />

    <input
      type="file"
      accept="image/*"
      onChange={(e) => setImage(e.target.files[0])}
      style={{ marginTop: "10px" }}
    />

    <button onClick={createPost} >
      Post
    </button>
  </div>
)}

      <div style={{ marginTop: "30px" }}>
        {posts.map((p, index) => {
          if (index === posts.length - 1) {
            return (
              <div ref={lastPostRef} key={p.id}>
                <Post
                  p={p}
                  userId={userId}
                  openUserProfile={openUserProfile}
                  openPost={openPost}
                />
              </div>
            );
          } else {
            return (
              <Post
                key={p.id}
                p={p}
                userId={userId}
                openUserProfile={openUserProfile}
                openPost={openPost}
              />
            );
          }
        })}
      </div>

      {loading && <p style={{ textAlign: "center" }}>Loading...</p>}

      {/* MODAL */}
      {selectedPost && (
        <div className="overlayStyle" onClick={closeModal}>
          <div className="modalStyle" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal}>X</button>

            <h3>{selectedPost.username}</h3>
            <p>{selectedPost.content}</p>

            {/* 🔥 DELETE BUTTON IN MODAL */}
            {selectedPost.user_id === userId && (
              <button
                onClick={deletePost}
                style={{
                  backgroundColor: "red",
                  color: "white",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Delete
              </button>
            )}

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
                onChange={(e) => setCommentInput(e.target.value)}
              />
              <button onClick={createComment}>Comment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}