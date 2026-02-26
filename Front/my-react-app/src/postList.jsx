// PostList.jsx
import PostItem from "./postItem";

function PostList({
  posts,
  likes,
  onOpenPost,
  onOpenUser,
  onToggleLike,
  title = "Posts",
}) {
  return (
    <>
      <h3>{title} ({posts.length})</h3>

      {posts.map((p) => (
        <PostItem
          key={p.id}
          post={p}
          likeInfo={likes[p.id]}
          onOpenPost={onOpenPost}
          onOpenUser={onOpenUser}
          onToggleLike={onToggleLike}
        />
      ))}
    </>
  );
}

export default PostList;