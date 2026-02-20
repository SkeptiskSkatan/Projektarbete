from fastapi import FastAPI, HTTPException
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

class CommentCreate(BaseModel):
    content: str
    user_id: int
    post_id: int

class FollowRequest(BaseModel):
    follower_id: int
    following_id: int

# Det ändrar detta 
def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="full_db",
        user="postgres",
        password="5DZ96PDs4U8aXs4eeTDGnVvQCwfzubJy2enxDhGw4dUHNv9wNMevUqEMQrXxxBnP"
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




@app.post("/register")
def register(user: UserRegister):
    if not user.username or not user.email or not user.password:
        raise HTTPException(
            status_code=400,
            detail="Username, email and password are required"
        )

    if password_too_weak(user.password):
        raise HTTPException(
            status_code=400,
            detail="Password is too weak"
        )

    if user_or_email_exists(user.username, user.email):
        raise HTTPException(
            status_code=409,
            detail="Username or email already exists"
        )

    password_hash = hash_password(user.password)

    cursor.execute(
        """
        INSERT INTO users (username, email, password_hash)
        VALUES (%s, %s, %s)
        """,
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




@app.post("/posts")
def create_post(post: Post):
    cursor.execute(
        "INSERT INTO posts (content, user_id) VALUES (%s, %s)",
        (post.content, post.user_id)
    )
    conn.commit()
    return {"message": "Post created"}


@app.get("/posts")
def get_posts(limit: int = 10, skip: int = 0):
    cursor = conn.cursor()
    # Use LIMIT and OFFSET for pagination
    cursor.execute("""
        SELECT posts.id, posts.content, users.username, posts.user_id
        FROM posts
        JOIN users ON posts.user_id = users.id
        ORDER BY posts.created_at DESC
        LIMIT %s OFFSET %s
    """, (limit, skip))

    rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "content": row[1],
            "username": row[2],
            "user_id": row[3]
        }
        for row in rows
    ]


@app.get("/users/{user_id}")
def get_user_profile(user_id: int):
    conn = get_connection() ###
    cursor = conn.cursor() ###

    cursor.execute("""
        SELECT id, username, email, created_at
        FROM users
        WHERE id = %s
    """, (user_id,))

    row = cursor.fetchone()

    cursor.close() ###
    conn.close() ###

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
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, content, created_at
        FROM posts
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (user_id,))

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return [
        {
            "id": row[0],          
            "content": row[1],
            "created_at": row[2]
        }
        for row in rows
    ]


@app.post("/comments")
def create_comment(comment: CommentCreate):

    if not comment.content:
        raise HTTPException(status_code=400, detail="Content is required")

    # Optional: check if user exists
    cursor.execute("SELECT 1 FROM users WHERE id = %s", (comment.user_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="User not found")

    # Optional: check if post exists
    cursor.execute("SELECT 1 FROM posts WHERE id = %s", (comment.post_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Post not found")

    cursor.execute(
        """
        INSERT INTO comments (content, user_id, post_id)
        VALUES (%s, %s, %s)
        """,
        (comment.content, comment.user_id, comment.post_id)
    )
    conn.commit()

    return {"message": "Comment created"}

@app.get("/posts/{post_id}/comments")
def get_comments(post_id: int):

    cursor.execute(
        """
        SELECT comments.content,
               comments.created_at,
               users.username
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.post_id = %s
        ORDER BY comments.created_at DESC
        """,
        (post_id,)
    )

    rows = cursor.fetchall()

    return [
        {
            "content": row[0],
            "created_at": row[1],
            "username": row[2]
        }
        for row in rows
    ]

@app.post("/follow")
def follow_user(req: FollowRequest):
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO followers (follower_id, following_id) 
        VALUES (%s, %s) ON CONFLICT DO NOTHING
    """, (req.follower_id, req.following_id))
    conn.commit()
    return {"message": "Followed"}

@app.post("/unfollow")
def unfollow_user(req: FollowRequest):
    cursor = conn.cursor()
    cursor.execute("""
        DELETE FROM followers 
        WHERE follower_id = %s AND following_id = %s
    """, (req.follower_id, req.following_id))
    conn.commit()
    return {"message": "Unfollowed"}

@app.get("/is_following/{follower_id}/{following_id}")
def is_following(follower_id: int, following_id: int):
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 1 FROM followers 
        WHERE follower_id = %s AND following_id = %s
    """, (follower_id, following_id))
    return {"is_following": cursor.fetchone() is not None}


@app.get("/users/{user_id}/follow_stats")
def get_follow_stats(user_id: int):
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM followers WHERE following_id = %s", (user_id,))
    followers_count = cursor.fetchone()[0]
    
    
    cursor.execute("SELECT COUNT(*) FROM followers WHERE follower_id = %s", (user_id,))
    following_count = cursor.fetchone()[0]
    
    return {
        "followers_count": followers_count,
        "following_count": following_count
    }
