import { useEffect, useState } from "react";
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
      body: JSON.stringify({
        user_id: userId,
        post_id: p.id
      })
    });

    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  }

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
      </div>

      <div onClick={() => openPost(p)} className="post-content">
        {p.content}
      </div>

      <div className="post-like">
        <button onClick={toggleLike}>
          {liked ? "❤️ Unlike" : "🤍 Like"} {likes}
        </button>
      </div>
    </div>
  );
}

export default function Feed({ userId }) {
  // Local state: posts from the server + current input text
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState("")
  const [message, setMessage] = useState("")

  // Fetch all posts from the backend
  async function fetchPosts() {
    const res = await fetch("http://localhost:8000/posts")
    const data = await res.json()
    setPosts(data)
  }

  // Create a new post, then refresh the feed
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
    <div className="feed-container">
      <h2>Feed</h2>
      <input
        placeholder="KIM YONG UN I'M KIM YONG UN"
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