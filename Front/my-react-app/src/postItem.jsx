import { useEffect, useState } from "react";

export default function PostItem({ p, userId, openUserProfile, onDelete }) {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");

  useEffect(() => {
    fetch(`http://localhost:8000/posts/${p.id}/likes/${userId}`)
      .then((res) => res.json())
      .then((data) => {
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

  async function fetchComments(postId) {
    const res = await fetch(`http://localhost:8000/posts/${postId}/comments`);
    const data = await res.json();
    setComments(data);
  }

  function openPost(e) {
    e.stopPropagation();
    setSelectedPost(p);
    fetchComments(p.id);
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
        post_id: p.id,
      }),
    });

    setCommentInput("");
    fetchComments(p.id);
  }

  async function deletePost() {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    const res = await fetch(`http://localhost:8000/posts/${p.id}/${userId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Could not delete post.");
      return;
    }

    closeModal();
    if (onDelete) onDelete(p.id);
  }

  const formattedDate =
    new Date(p.created_at).toLocaleDateString("sv-SE") +
    " kl. " +
    new Date(p.created_at).toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <>
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

        <div className="post-content" onClick={openPost}>
          {p.content}
          {p.image_data && (
            <img
              src={p.image_data}
              alt="post"
              className="image_content"
            />
          )}
        </div>

        <div onClick={toggleLike} style={{ marginTop: "8px", fontSize: "16px" }}>
          {liked ? "❤️" : "🤍"} {likes}
        </div>

      </div>

      {selectedPost && (
        <div className="overlayStyle" onClick={closeModal}>
          <div className="modalStyle" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal}>X</button>

            <h3>{selectedPost.username}</h3>
            <p>{selectedPost.content}</p>

            {selectedPost.image_data && (
              <img
                src={selectedPost.image_data}
                alt="post"
                style={{ width: "100%", marginTop: "10px", borderRadius: "8px" }}
              />
            )}

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



            <div style={{ marginTop: "15px" }}>
              <input
                placeholder="Comment"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
              />
              <button onClick={createComment}>Comment</button>
            </div>

            {comments.map((c, i) => (
              <p key={i}>
                <b>{c.username}</b>: {c.content}
              </p>
            ))}


          </div>
        </div>
      )}
    </>
  );
}