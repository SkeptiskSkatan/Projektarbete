import { useEffect, useState } from "react";
import "./main.css";

export default function Profile({ userId, currentUserId, openUserProfile }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({
    followers_count: 0,
    following_count: 0,
  });

  const [listModal, setListModal] = useState(null);
  const [userList, setUserList] = useState([]);

  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:8000/users/${userId}`)
      .then((res) => res.json())
      .then(setUser);

    fetch(`http://localhost:8000/users/${userId}/posts`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        data.forEach((p) => fetchLikes(p.id));
      });

    fetch(`http://localhost:8000/users/${userId}/follow_stats`)
      .then((res) => res.json())
      .then(setStats);

    if (currentUserId && userId !== currentUserId) {
      fetch(
        `http://localhost:8000/is_following/${currentUserId}/${userId}`
      )
        .then((res) => res.json())
        .then((data) => setIsFollowing(data.is_following));
    }
  }, [userId, currentUserId]);

  async function toggleFollow() {
    const endpoint = isFollowing ? "unfollow" : "follow";

    await fetch(`http://localhost:8000/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        follower_id: currentUserId,
        following_id: userId,
      }),
    });

    setIsFollowing(!isFollowing);

    const res = await fetch(
      `http://localhost:8000/users/${userId}/follow_stats`
    );
    const newStats = await res.json();
    setStats(newStats);
  }

  async function fetchLikes(postId) {
    const res = await fetch(
      `http://localhost:8000/posts/${postId}/likes/${currentUserId}`
    );
    const data = await res.json();
    setLikes((prev) => ({ ...prev, [postId]: data }));
  }

  async function toggleLike(postId) {
    const liked = likes[postId]?.liked;
    const endpoint = liked ? "unlike" : "like";

    await fetch(`http://localhost:8000/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: currentUserId,
        post_id: postId,
      }),
    });

    fetchLikes(postId);
  }

  async function fetchComments(postId) {
    const res = await fetch(
      `http://localhost:8000/posts/${postId}/comments`
    );
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
    if (!commentInput.trim() || !selectedPost) return;

    await fetch("http://localhost:8000/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: commentInput,
        user_id: currentUserId,
        post_id: selectedPost.id,
      }),
    });

    setCommentInput("");
    fetchComments(selectedPost.id);
  }

  async function deletePost() {
    if (!selectedPost) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (!confirmDelete) return;

    const res = await fetch(
      `http://localhost:8000/posts/${selectedPost.id}/${currentUserId}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      alert("Could not delete post.");
      return;
    }

    setPosts((prev) =>
      prev.filter((p) => p.id !== selectedPost.id)
    );

    closeModal();
  }

  async function openList(type) {
    const res = await fetch(
      `http://localhost:8000/users/${userId}/${type}`
    );
    const data = await res.json();
    setUserList(data);
    setListModal(type);
  }

  function closeList() {
    setListModal(null);
    setUserList([]);
  }

  if (!user) return <p>Loading profile...</p>;

  return (
    <>
      <h2>Profile</h2>

      <p><b>Username:</b> {user.username}</p>
      <p><b>Joined:</b> {new Date(user.created_at).toLocaleDateString()}</p>

      <div style={{ display: "flex", gap: "15px", marginBottom: "10px" }}>
        <span style={{ cursor: "pointer" }} onClick={() => openList("followers")}>
          <b>{stats.followers_count}</b> Followers
        </span>

        <span style={{ cursor: "pointer" }} onClick={() => openList("following")}>
          <b>{stats.following_count}</b> Following
        </span>
      </div>

      {posts.map((p) => {
        const liked = likes[p.id]?.liked;
        const likesCount = likes[p.id]?.likes_count || 0;

        const formattedDate =
          new Date(p.created_at).toLocaleDateString("sv-SE") +
          " kl. " +
          new Date(p.created_at).toLocaleTimeString("sv-SE", {
            hour: "2-digit",
            minute: "2-digit",
          });

        return (
          <div key={p.id} className="post">

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

              <div className="post-date">
                {formattedDate}
              </div>
            </div>

            <div onClick={() => openPost(p)} className="post-content">
              {p.content}
            </div>

            <div style={{ marginTop: "8px", fontSize: "16px" }}>
              {liked ? "❤️" : "🤍"} {likesCount}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button onClick={() => toggleLike(p.id)}>
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
      })}

      {selectedPost && (
        <div className="overlayStyle" onClick={closeModal}>
          <div className="modalStyle" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal}>X</button>

            <h3>{selectedPost.username}</h3>
            <p>{selectedPost.content}</p>

            {selectedPost.user_id === currentUserId && (
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

            {comments.map((c, i) => (
              <p key={i}>
                <b>{c.username}</b>: {c.content}
              </p>
            ))}

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

      {listModal && (
        <div className="overlayStyle" onClick={closeList}>
          <div className="modalStyle" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeList}>X</button>

            <h3>
              {listModal === "followers" ? "Followers" : "Following"}
            </h3>

            {userList.map((u) => (
              <p
                key={u.id}
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  closeList();
                  openUserProfile(u.id);
                }}
              >
                {u.username}
              </p>
            ))}
          </div>
        </div>
      )}
    </>
  );
}