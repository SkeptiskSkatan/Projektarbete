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
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    if (!userId) return;

    fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`)
      .then((res) => res.json())
      .then(setUser);

    fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/posts`)
      .then((res) => res.json())
      .then(setPosts);

    fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/follow_stats`)
      .then((res) => res.json())
      .then(setStats);

    if (currentUserId && userId !== currentUserId) {
      fetch(`${import.meta.env.VITE_API_URL}/is_following/${currentUserId}/${userId}`)
        .then((res) => res.json())
        .then((data) => setIsFollowing(data.is_following));
    }

    fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/profile_picture`)
      .then((res) => res.json())
      .then((data) => setProfilePic(data.image_data));
  }, [userId, currentUserId]);

  async function toggleFollow() {
    const endpoint = isFollowing ? "unfollow" : "follow";

    await fetch(`${import.meta.env.VITE_API_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ follower_id: currentUserId, following_id: userId }),
    });

    setIsFollowing(!isFollowing);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/follow_stats`);
    const newStats = await res.json();
    setStats(newStats);
  }

  function handleDelete(postId) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function openList(type) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/${type}`);
    const data = await res.json();
    setUserList(data);
    setListModal(type);
  }

  function closeList() {
    setListModal(null);
    setUserList([]);
  }

  async function uploadProfilePicture(e) {
    const file = e.target.files[0];
    if (!file) return;

    const base64String = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/profile_picture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, image_data: base64String }),
    });

    setProfilePic(base64String);
  }

  if (!user) return <p>Loading profile...</p>;

  return (
    <>
      <h2>Profile</h2>

<div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
  <div style={{ position: "relative" }}>
    {userId === currentUserId ? (
      <label style={{ cursor: "pointer" }}>
        {profilePic ? (
          <img
            src={profilePic}
            alt="profile"
            style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            backgroundColor: "#ccc", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            No pic
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={uploadProfilePicture}
          style={{ display: "none" }}
        />
      </label>
    ) : (
      profilePic ? (
        <img
          src={profilePic}
          alt="profile"
          style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
        />
      ) : (
        <div style={{
          width: "80px", height: "80px", borderRadius: "50%",
          backgroundColor: "#ccc", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          No pic
        </div>
      )
    )}
  </div>

  <div>
    <p><b>Username:</b> {user.username}</p>
    <p><b>Joined:</b> {new Date(user.created_at).toLocaleDateString()}</p>
  </div>
</div>

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