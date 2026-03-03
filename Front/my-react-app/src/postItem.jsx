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

      <div onClick={() => onOpenPost(post)} className="post-content">
        {post.content}

        {post.image_data && (
          <img
            src={post.image_data}
            alt="post"
            className="post-image"
            style={{
              width: "100%",
              marginTop: "10px",
              borderRadius: "8px",
            }}
          />
        )}
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