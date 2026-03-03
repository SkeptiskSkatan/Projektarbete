import { useEffect, useState } from "react";
import PostItem from "./postItem";
import "./main.css";

export default function Profile({ userId, currentUserId, openUserProfile }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({ followers_count: 0, following_count: 0 });
  const [listModal, setListModal] = useState(null);
  const [userList, setUserList] = useState([]);

  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:8000/users/${userId}`)
      .then((res) => res.json())
      .then(setUser);

    fetch(`http://localhost:8000/users/${userId}/posts`)
      .then((res) => res.json())
      .then(setPosts);

    fetch(`http://localhost:8000/users/${userId}/follow_stats`)
      .then((res) => res.json())
      .then(setStats);

    if (currentUserId && userId !== currentUserId) {
      fetch(`http://localhost:8000/is_following/${currentUserId}/${userId}`)
        .then((res) => res.json())
        .then((data) => setIsFollowing(data.is_following));
    }
  }, [userId, currentUserId]);

  async function toggleFollow() {
    const endpoint = isFollowing ? "unfollow" : "follow";

    await fetch(`http://localhost:8000/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ follower_id: currentUserId, following_id: userId }),
    });

    setIsFollowing(!isFollowing);

    const res = await fetch(`http://localhost:8000/users/${userId}/follow_stats`);
    const newStats = await res.json();
    setStats(newStats);
  }

  function handleDelete(postId) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function openList(type) {
    const res = await fetch(`http://localhost:8000/users/${userId}/${type}`);
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

      {userId !== currentUserId && (
        <button onClick={toggleFollow} style={{ marginBottom: "15px" }}>
          {isFollowing ? "Unfollow" : "Follow"}
        </button>
      )}

      {posts.map((p) => (
        <PostItem
          key={p.id}
          p={p}
          userId={currentUserId}
          openUserProfile={openUserProfile}
          onDelete={handleDelete}
        />
      ))}

      {listModal && (
        <div className="overlayStyle" onClick={closeList}>
          <div className="modalStyle" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeList}>X</button>
            <h3>{listModal === "followers" ? "Followers" : "Following"}</h3>
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
