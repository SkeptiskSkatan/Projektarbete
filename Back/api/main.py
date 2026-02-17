from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from database import conn 
import bcrypt
import psycopg2
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],   
    allow_headers=["*"],
)

cursor = conn.cursor()

# -------------------
# MODELS
# -------------------
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Post(BaseModel):
    content: str
    user_id: int

class LikePost(BaseModel):
    user_id: int
    post_id: int

# -------------------
# HELPERS
# -------------------
def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="Dired_racoon2",
        user="postgres",
        password="Kamel1212"
    )

def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(
        password.encode("utf-8"),
        password_hash.encode("utf-8")
    )

def password_too_weak(password):
    return len(password) < 4

def user_or_email_exists(username, email):
    cursor.execute(
        "SELECT 1 FROM users WHERE username = %s OR email = %s",
        (username, email)
    )
    return cursor.fetchone() is not None

# -------------------
# AUTH
# -------------------
@app.post("/register")
def register(user: UserRegister):
    if not user.username or not user.email or not user.password:
        raise HTTPException(status_code=400, detail="Username, email and password are required")

    if password_too_weak(user.password):
        raise HTTPException(status_code=400, detail="Password is too weak")

    if user_or_email_exists(user.username, user.email):
        raise HTTPException(status_code=409, detail="Username or email already exists")

    password_hash = hash_password(user.password)

    cursor.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
        (user.username, user.email, password_hash)
    )
    conn.commit()
    return {"message": "User created"}

@app.post("/login")
def login(user: UserLogin):
    cursor.execute(
        "SELECT id, password_hash FROM users WHERE username = %s",
        (user.username,)
    )
    result = cursor.fetchone()

    if not result:
        raise HTTPException(status_code=401, detail="Wrong credentials")

    user_id, password_hash = result

    if not verify_password(user.password, password_hash):
        raise HTTPException(status_code=401, detail="Wrong credentials")

    return {"user_id": user_id}

# -------------------
# POSTS
# -------------------
@app.post("/posts")
def create_post(post: Post):
    cursor.execute(
        "INSERT INTO posts (content, user_id) VALUES (%s, %s)",
        (post.content, post.user_id)
    )
    conn.commit()
    return {"message": "Post created"}

@app.get("/posts")
def get_posts(user_id: int):
    """
    Hämtar alla poster med antal likes och om den aktuella user_id har likeat.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                posts.id,
                posts.content,
                posts.user_id,
                users.username,
                COALESCE(lc.likes_count, 0) AS likes,
                CASE WHEN l.user_id IS NULL THEN FALSE ELSE TRUE END AS liked_by_user
            FROM posts
            JOIN users ON posts.user_id = users.id
            LEFT JOIN (
                SELECT post_id, COUNT(*) AS likes_count
                FROM likes
                GROUP BY post_id
            ) lc ON posts.id = lc.post_id
            LEFT JOIN likes l ON posts.id = l.post_id AND l.user_id = %s
            ORDER BY posts.created_at DESC
        """, (user_id,))
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    return [
        {
            "id": row[0],
            "content": row[1],
            "user_id": row[2],
            "username": row[3],
            "likes": row[4],
            "liked_by_user": row[5]
        }
        for row in rows
    ]

# -------------------
# LIKE / UNLIKE
# -------------------
@app.post("/like")
def toggle_like(like: LikePost):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Kolla om användaren redan likeat
        cursor.execute("SELECT 1 FROM likes WHERE user_id = %s AND post_id = %s", (like.user_id, like.post_id))
        if cursor.fetchone():
            # Ta bort like (unlike)
            cursor.execute("DELETE FROM likes WHERE user_id = %s AND post_id = %s", (like.user_id, like.post_id))
        else:
            # Lägg till like
            cursor.execute("INSERT INTO likes (user_id, post_id) VALUES (%s, %s)", (like.user_id, like.post_id))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

    return {"message": "Toggled like"}

# -------------------
# USER PROFILE
# -------------------
@app.get("/users/{user_id}")
def get_user_profile(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, username, email, created_at
        FROM users
        WHERE id = %s
    """, (user_id,))
    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if row is None:
        raise HTTPException(status_code=404, detail="User not found")

    id, username, email, created_at = row
    return {
        "id": id,
        "username": username,
        "email": email,
        "created_at": created_at
    }

@app.get("/users/{user_id}/posts")
def get_user_posts(user_id: int):
    cursor.execute("""
        SELECT content, created_at
        FROM posts
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (user_id,))
    rows = cursor.fetchall()

    return [{"content": row[0], "created_at": row[1]} for row in rows]