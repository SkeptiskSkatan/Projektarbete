<<<<<<< HEAD
import PostItem from "./PostItem";
=======
// PostList.jsx
import PostItem from "./postItem";
>>>>>>> 9bb42d4737be2e3b546a7ae0f4c2ce4c3ca1a767

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