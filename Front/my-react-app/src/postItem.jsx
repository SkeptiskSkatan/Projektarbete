<<<<<<< HEAD
=======
// PostItem.jsx
>>>>>>> 9bb42d4737be2e3b546a7ae0f4c2ce4c3ca1a767
function PostItem({
  post,
  likeInfo,
  onOpenPost,
  onOpenUser,
  onToggleLike,
}) {
  return (
    <div className="post">
      <div className="post-header">
        <b
          onClick={(e) => {
            e.stopPropagation();
            onOpenUser(post.user_id);
          }}
        >
          {post.username}
        </b>
      </div>

      <div
        onClick={() => onOpenPost(post)}
        className="post-content"
      >
        {post.content}
      </div>

      <div className="post-like">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(post.id);
          }}
          style={{
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          {likeInfo?.liked ? "❤️" : "🤍"} {likeInfo?.likes_count || 0}
        </button>
      </div>
    </div>
  );
}

export default PostItem;