import { useEffect, useState, useRef, useCallback } from "react";
import PostItem from "./postItem";
import "./main.css";

export default function Feed({ userId, openUserProfile }) {
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
        reader.readAsDataURL(image);
      });
    }

    await fetch("http://localhost:8000/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, user_id: userId, image_data: base64String }),
    });

    setContent("");
    setImage(null);
    loadPosts(0);
  }

  function handleDelete(postId) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  return (
    <div className="feed-container">
      <h2>Feed</h2>

      <div style={{ marginBottom: "15px" }}>
        <button
          onClick={() => { setFeedType("all"); setSkip(0); }}
          style={{ marginRight: "10px", fontWeight: feedType === "all" ? "bold" : "normal" }}
        >
          All Feed
        </button>
        <button
          onClick={() => { setFeedType("following"); setSkip(0); }}
          style={{ fontWeight: feedType === "following" ? "bold" : "normal" }}
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
          <button onClick={createPost}>Post</button>
        </div>
      )}

      {/*Posts */}
      <div style={{ marginTop: "30px" }}>
        {posts.map((p, index) => {
          const isLast = index === posts.length - 1;
          return (
            <div ref={isLast ? lastPostRef : null} key={p.id}>
              <PostItem
                p={p}
                userId={userId}
                openUserProfile={openUserProfile}
                onDelete={handleDelete}
              />
            </div>
          );
        })}
      </div>

      {loading && <p style={{ textAlign: "center" }}>Loading...</p>}
    </div>
  );
}