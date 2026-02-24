import { useEffect, useState } from "react";
import "./main.css";

function Post({ p, userId, openUserProfile }) {
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



  //man kan göra så att man 
  function openPost(post) {
    setSelectedPost(post)
    fetchComments(post.id)
  }

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

export default function Feed({ userId, logout, openUserProfile }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [skip, setSkip] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadPosts(0);
  }, []);

  async function loadPosts(newSkip) {
    const res = await fetch(
      `http://localhost:8000/posts?limit=${limit}&skip=${newSkip}`
    );
    const data = await res.json();

    if (newSkip === 0) {
      setPosts(data);
    } else {
      setPosts(prev => [...prev, ...data]);
    }

    setSkip(newSkip + limit);
  }

  async function createPost() {
    if (!content.trim()) return;

    await fetch("http://localhost:8000/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        user_id: userId
      })
    });

    setContent("");
    loadPosts(0); // reload feed
  }

  return (
    <div className="feed-container">
      <h2>Feed</h2>

      <div style={{ marginTop: "20px" }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Det"
          rows="3"
          style={{ width: "100%" }}
        />
        <button onClick={createPost} style={{ marginTop: "10px" }}>
          Post
        </button>
      </div>

      <div style={{ marginTop: "30px" }}>
        {posts.map(p => (
          <Post
            key={p.id}
            p={p}
            userId={userId}
            openUserProfile={openUserProfile}
          />
        ))}
      </div>

      <button
        className="load-more-btn"
        onClick={() => loadPosts(skip)}
      >
        Load More
      </button>
    </div>
  );
}