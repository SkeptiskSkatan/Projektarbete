import { useEffect, useState } from "react";

function App() {

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/posts")
      .then(res => res.json())
      .then(data => setPosts(data));
  }, []);

  const handleSubmit = () => {

    const postData = {
      id: posts.length + 1,
      content: newPost
    };

    fetch("http://127.0.0.1:8000/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(postData)
    })
      .then(res => res.json())
      .then(data => {
        setPosts([...posts, data]);
        setNewPost("");
      });
  };

  return (
    <div style={styles.container}>

      <h1>Här</h1>

      <div style={styles.postBox}>
        <input
          type="text"
          placeholder=""
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleSubmit} style={styles.button}>
          Post
        </button>
      </div>

      {/* Fe */}
      <div>
        {posts.map(post => (
          <div key={post.id} style={styles.post}>
            {post.content}
          </div>
        ))}
      </div>

    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "auto",
    padding: "20px",
    fontFamily: "Arial"
  },
  postBox: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px"
  },
  input: {
    flex: 1,
    padding: "10px"
  },
  button: {
    padding: "10px",
    cursor: "pointer"
  },
  post: {
    background: "#f2f2f2",
    padding: "15px",
    borderRadius: "5px",
    marginBottom: "10px"
  }
};

export default App;